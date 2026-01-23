<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Http;

class MistralClient
{
    private function currentModel(): string
    {
        return config('services.mistral.model', 'mistral-medium-latest');
    }

    private function buildMeta(array $result, int $attempt): array
    {
        return [
            'provider' => 'mistral',
            'model' => $this->currentModel(),
            'attempt' => $attempt,
            'response' => $result,
        ];
    }

    public function advise(array $messages, ?int $timeoutSeconds = null): array
    {
        $apiKey = config('services.mistral.api_key');
        $baseUrl = rtrim(config('services.mistral.base_url'), '/');
        $model = $this->currentModel();

        if (!$apiKey) {
            return ['error' => 'Mistral credentials missing'];
        }

        $client = Http::withToken($apiKey);
        if ($timeoutSeconds) {
            $client = $client->timeout($timeoutSeconds)->connectTimeout(min(5, $timeoutSeconds));
        }

        $response = $client->post(
            "{$baseUrl}/chat/completions",
            [
                'model' => $model,
                'messages' => $messages,
            ],
        );

        $json = null;
        try {
            $json = $response->json();
        } catch (\Throwable $th) {
            // ignore json decode errors
        }

        if ($response->failed()) {
            return [
                'error' => 'Mistral request failed',
                'status' => $response->status(),
                'body' => $response->body(),
                'json' => $json,
            ];
        }

        return $json ?? [];
    }

    public function quickReply(array $messages, int $timeoutSeconds = 12): array
    {
        $result = $this->advise($messages, $timeoutSeconds);
        if (isset($result['error'])) {
            return $result;
        }

        $message = $this->extractMessage($result) ?? $this->extractContent($result);
        if (!$message) {
            return ['error' => 'invalid_message'];
        }

        return [
            'message' => $message,
            'meta' => $this->buildMeta($result, 1),
        ];
    }

    public function structuredReply(array $messages, int $timeoutSeconds = 60): array
    {
        $attempts = 0;
        $payload = $messages;

        while ($attempts < 2) {
            $result = $this->advise($payload, $timeoutSeconds);
            if (isset($result['error'])) {
                return $result;
            }

            $content = $this->extractContent($result);
            $decoded = $content ? $this->decodeJsonContent($content) : null;

            if (is_array($decoded)) {
                return [
                    'data' => $decoded,
                    'meta' => $this->buildMeta($result, $attempts + 1),
                ];
            }

            $attempts++;
            $payload[] = [
                'role' => 'user',
                'content' => 'Responda apenas com JSON válido, sem markdown ou explicações.',
            ];
        }

        return ['error' => 'invalid_message'];
    }

    private function callAgent(array $messages): array
    {
        return $this->advise($messages);
    }

    private function extractContent(array $result): ?string
    {
        // chat/completions response style
        if (isset($result['choices'][0]['message']['content'])) {
            $content = $result['choices'][0]['message']['content'];
            if (is_string($content)) {
                return trim($content);
            }
        }

        // legacy agent style
        $message = $result['output']['message'] ?? $result['message'] ?? null;
        if (!$message && is_string($result['output'] ?? null)) {
            $decoded = json_decode($result['output'], true);
            if (is_array($decoded) && isset($decoded['message'])) {
                $message = $decoded['message'];
            }
        }

        return is_string($message) ? trim($message) : null;
    }

    private function stripCodeFence(string $content): string
    {
        $trimmed = trim($content);
        if (preg_match('/```(?:json)?\s*(.*?)```/s', $trimmed, $match)) {
            return trim($match[1]);
        }
        return $trimmed;
    }

    private function decodeJsonContent(string $content): ?array
    {
        $trimmed = $this->stripCodeFence($content);
        if ($trimmed === '') {
            return null;
        }

        $decoded = json_decode($trimmed, true);
        return is_array($decoded) ? $decoded : null;
    }

    private function looksLikeJson(string $content): bool
    {
        $trimmed = $this->stripCodeFence($content);
        return str_starts_with($trimmed, '{') && str_ends_with($trimmed, '}');
    }

    private function extractMessage(array $result): ?string
    {
        $content = $this->extractContent($result);
        if (!$content) {
            return null;
        }

        $decoded = $this->decodeJsonContent($content);
        if (is_array($decoded) && isset($decoded['message']) && is_string($decoded['message'])) {
            return trim($decoded['message']);
        }

        if ($this->looksLikeJson($content)) {
            return null;
        }

        return $this->stripCodeFence($content);
    }

    private function normalizeText(string $text): string
    {
        $text = function_exists('mb_strtolower') ? mb_strtolower($text) : strtolower($text);
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text);
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    private function lastUserMessage(array $history): string
    {
        foreach (array_reverse($history) as $item) {
            if (($item['role'] ?? '') === 'user') {
                return (string) ($item['content'] ?? '');
            }
        }
        return '';
    }

    private function recentAssistantMessages(array $history, int $limit = 3): array
    {
        $messages = [];
        foreach (array_reverse($history) as $item) {
            if (($item['role'] ?? '') === 'assistant') {
                $content = (string) ($item['content'] ?? '');
                $messages[] = trim(substr($content, 0, 160));
                if (count($messages) >= $limit) {
                    break;
                }
            }
        }
        return $messages;
    }

    private function isRepeatedMessage(string $message, array $history): bool
    {
        $normalized = $this->normalizeText($message);
        if ($normalized === '') {
            return true;
        }

        foreach ($this->recentAssistantMessages($history) as $previous) {
            $prevNormalized = $this->normalizeText($previous);
            if ($prevNormalized === '') {
                continue;
            }
            if ($normalized === $prevNormalized) {
                return true;
            }
            if (strlen($normalized) > 12 && (str_contains($normalized, $prevNormalized) || str_contains($prevNormalized, $normalized))) {
                return true;
            }
            similar_text($normalized, $prevNormalized, $percent);
            if ($percent > 88) {
                return true;
            }
        }

        return false;
    }

    private function isEchoingUser(string $message, array $history): bool
    {
        $lastUser = $this->lastUserMessage($history);
        if (!$lastUser) {
            return false;
        }

        $normalizedMessage = $this->normalizeText($message);
        $normalizedUser = $this->normalizeText($lastUser);
        if (strlen($normalizedUser) < 25) {
            return false;
        }

        if (str_contains($normalizedMessage, $normalizedUser)) {
            return true;
        }

        similar_text($normalizedMessage, $normalizedUser, $percent);
        return $percent > 80 && strlen($normalizedMessage) > 20;
    }

    private function isInvalidAssistantMessage(?string $message, array $history): bool
    {
        if (!$message) {
            return true;
        }

        if ($this->isRepeatedMessage($message, $history)) {
            return true;
        }

        if ($this->isEchoingUser($message, $history)) {
            return true;
        }

        return false;
    }

    private function baseContext(?Project $project = null): array
    {
        $intentNote = '';
        if ($project && is_array($project->tags)) {
            if (in_array('negocio', $project->tags, true)) {
                $intentNote = 'Tipo do projeto: negócio. Direcione as perguntas para dor do usuário, impacto financeiro, viabilidade, custos e prazos. Seja realista e direto.';
            } elseif (in_array('estudos', $project->tags, true)) {
                $intentNote = 'Tipo do projeto: estudos. Pergunte sobre o que a pessoa quer se aprofundar e ofereça dicas práticas e educativas de forma gentil.';
            } elseif (in_array('software_padrao', $project->tags, true)) {
                $intentNote = 'Tipo do projeto: software padrão. Foque em entender funcionalidades e como vai funcionar, sem dar opinião ou sugerir soluções.';
            }
        }

        return [
            [
                'role' => 'system',
                'content' => trim('Você é um consultor de negócio sênior com visão realista de mercado para projetos de software. Responda sempre em pt-BR, com linguagem simples, objetiva, educada e profissional. Seja conservador: não faça sugestões ou soluções antes de entender objetivo, público e restrições. Se o contexto estiver raso, faça uma pergunta direta e curta, sem opinião. Faça apenas uma pergunta por vez, sem listas longas. Evite jargões; se precisar usar termos técnicos, explique rapidamente. Não devolva JSON ao usuário final; quando solicitado a estruturar dados, retorne em JSON apenas para o sistema, com campos claros (ex: {"message":"..."}). '.$intentNote),
            ],
        ];
    }

    /**
     * Conversa iterativa: retorna próxima pergunta.
     */
    public function nextQuestion(array $history, ?Project $project = null): array
    {
        $avoid = $this->recentAssistantMessages($history, 3);
        $avoidText = $avoid
            ? 'Evite repetir perguntas anteriores: '.implode(' | ', $avoid).'.'
            : '';
        $messages = array_merge($this->baseContext($project), $history);
        $messages[] = [
            'role' => 'user',
            'content' => 'Responda em pt-BR com JSON {"message":"..."} com uma mensagem amigável de até 2 frases curtas: 1) uma contextualização neutra e breve (opcional; se o contexto for raso, não escreva); 2) uma pergunta simples e direta para entender melhor o projeto. Evite jargões como "caso de uso", "stakeholder", "roadmap", "MVP". Não repita a fala do usuário nem use aspas. '.$avoidText.' Não faça listas. Retorne somente o JSON, sem markdown e sem ```.',
        ];

        $attempts = 0;
        while ($attempts < 3) {
            $result = $this->callAgent($messages);
            if (isset($result['error'])) {
                $attempts++;
                $messages[] = [
                    'role' => 'user',
                    'content' => 'Tente novamente e responda apenas com o JSON válido, sem markdown.',
                ];
                continue;
            }

            $message = $this->extractMessage($result);
            if (!$this->isInvalidAssistantMessage($message, $history)) {
                return [
                    'message' => $message,
                    'meta' => $this->buildMeta($result, $attempts + 1),
                ];
            }

            $attempts++;
            $messages[] = [
                'role' => 'user',
                'content' => 'Gere outra mensagem diferente das anteriores, simples e sem repetir o usuário. Responda no mesmo JSON, sem markdown.',
            ];
        }

        return ['error' => 'invalid_message'];
    }

    /**
     * Avalia a resposta. Se insuficiente, retorna follow-up. Caso ok, retorna resumo.
     */
    public function reviewAnswer(Project $project, array $history): array
    {
        $messages = array_merge($this->baseContext($project), $history, [
            [
                'role' => 'user',
                'content' => 'Avalie a última resposta do usuário. Se estiver fraca ou vaga, retorne JSON {needs_more:true, message:"..."} com uma mensagem educada e direta pedindo um detalhe prático (pt-BR), sem sugerir soluções. Evite jargões como "caso de uso". Não repita perguntas anteriores e não repita a fala do usuário. Se suficiente, retorne JSON {needs_more:false, summary:{overview, purpose, scope, target_users, nfr_summary}} em pt-BR. No overview, traga uma visão clara, curta e realista do projeto. Retorne somente o JSON, sem markdown e sem ```.',
            ],
        ]);

        $attempts = 0;
        $reviewMessages = $messages;

        while ($attempts < 2) {
            $result = $this->callAgent($reviewMessages);
            if (isset($result['error'])) {
                $attempts++;
                $reviewMessages[] = [
                    'role' => 'user',
                    'content' => 'Retorne apenas JSON válido, sem markdown.',
                ];
                continue;
            }

            $content = $this->extractContent($result);
            $output = is_string($content) ? $this->decodeJsonContent($content) : null;
            if (!is_array($output)) {
                $attempts++;
                $reviewMessages[] = [
                    'role' => 'user',
                    'content' => 'Preciso apenas do JSON no formato combinado, sem markdown.',
                ];
                continue;
            }

            if (isset($output['needs_more']) && $output['needs_more'] === false && isset($output['summary'])) {
                $summary = is_array($output['summary']) ? $output['summary'] : [];
                if (!empty($summary)) {
                    return [
                        'needs_more' => false,
                        'summary' => $summary,
                        'meta' => $this->buildMeta($result, $attempts + 1),
                    ];
                }
            }

            if (isset($output['needs_more']) && $output['needs_more'] === true) {
                $message = $output['message'] ?? $output['question'] ?? $output['feedback'] ?? null;
                $message = is_string($message) ? trim($message) : null;
                if ($message && !$this->isInvalidAssistantMessage($message, $history)) {
                    return [
                        'needs_more' => true,
                        'message' => $message,
                        'meta' => $this->buildMeta($result, $attempts + 1),
                    ];
                }

                $next = $this->nextQuestion($history, $project);
                if (!empty($next['message'])) {
                    return [
                        'needs_more' => true,
                        'message' => $next['message'],
                        'meta' => $next['meta'] ?? null,
                    ];
                }

                return ['error' => 'invalid_message'];
            }

            $attempts++;
            $reviewMessages[] = [
                'role' => 'user',
                'content' => 'Retorne apenas JSON válido, sem markdown.',
            ];
        }

        return ['error' => 'invalid_message'];
    }

    /**
     * Força resumo mesmo com informações incompletas.
     */
    public function summarizeNow(Project $project, array $history): array
    {
        $messages = array_merge($this->baseContext($project), $history, [
            [
                'role' => 'user',
                'content' => 'Gere um resumo do projeto em pt-BR mesmo que faltem dados. Retorne JSON {summary:{overview, purpose, scope, target_users, nfr_summary}}. Se faltar informação, deixe claro com "Não informado" ou "A definir" em cada campo. Seja direto e realista. Retorne somente o JSON, sem markdown e sem ```.',
            ],
        ]);

        $attempts = 0;
        while ($attempts < 2) {
            $result = $this->callAgent($messages);
            if (isset($result['error'])) {
                $attempts++;
                $messages[] = [
                    'role' => 'user',
                    'content' => 'Retorne apenas JSON válido, sem markdown.',
                ];
                continue;
            }

            $content = $this->extractContent($result);
            $output = is_string($content) ? $this->decodeJsonContent($content) : null;
            $summary = is_array($output['summary'] ?? null) ? $output['summary'] : null;
            if ($summary) {
                return [
                    'summary' => $summary,
                    'meta' => $this->buildMeta($result, $attempts + 1),
                ];
            }

            $attempts++;
            $messages[] = [
                'role' => 'user',
                'content' => 'Preciso apenas do JSON no formato combinado, sem markdown.',
            ];
        }

        return ['error' => 'invalid_message'];
    }
}
