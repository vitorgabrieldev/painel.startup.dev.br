<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Services\MistralClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProjectChatController extends Controller
{
    public function createManual(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'min:2', 'max:120'],
        ]);

        $name = trim($data['title']);
        $slug = $this->makeUniqueSlug(Str::slug($name) ?: 'project');

        $project = Project::create([
            'name' => $name,
            'slug' => $slug,
            'purpose' => null,
            'scope' => null,
            'overview' => null,
            'status' => 'draft',
            'opinionation_level' => 'guided',
            'ai_advisory_enabled' => true,
            'ai_consistency_checks_enabled' => false,
        ]);
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'role' => 'owner',
        ]);

        return response()->json([
            'project' => $project->fresh(),
        ]);
    }

    public function start(Request $request, MistralClient $mistral)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'min:1'],
            'history' => ['array'],
        ]);

        $name = Str::limit(Str::headline($data['message']), 60, '');
        $slug = $this->makeUniqueSlug(Str::slug($name ?: 'project') ?: 'project');

        $project = Project::create([
            'name' => $name ?: 'New Project',
            'slug' => $slug,
            'purpose' => $data['message'],
            'scope' => $data['message'],
            'overview' => null,
            'status' => 'draft',
            'opinionation_level' => 'guided',
            'ai_advisory_enabled' => true,
            'ai_consistency_checks_enabled' => false,
        ]);
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'role' => 'owner',
        ]);

        $chat = $project->chats()->create([
            'title' => $name ?: 'Chat inicial',
            'status' => 'active',
            'created_by' => $request->user()->id,
        ]);

        $history = $data['history'] ?? [];
        $history[] = ['role' => 'user', 'content' => $data['message']];
        $chat
            ->messages()
            ->create($this->buildUserMessagePayload($request, $data['message']));

        $message =
            'Este projeto é para negócio, estudos ou é um software padrão (uso geral)?';
        $history[] = ['role' => 'assistant', 'content' => $message];
        $chat
            ->messages()
            ->create($this->buildAssistantMessagePayload($message));
        $chat->update([
            'pending_intent_message' => $message,
            'pending_intent_options' => [
                ['value' => 'business', 'label' => 'Negócio'],
                ['value' => 'study', 'label' => 'Estudos'],
                ['value' => 'default', 'label' => 'Software padrão'],
            ],
        ]);
        $this->logProjectChat($project->id, [
            'action' => 'start',
            'user_message_length' => $this->messageLength($data['message']),
            'assistant_length' => $this->messageLength($message),
        ]);

        return response()->json([
            'project' => $project->fresh(),
            'message' => $message,
            'history' => $history,
            'questionsAsked' => 0,
            'questionType' => 'business_intent',
            'options' => [
                ['value' => 'business', 'label' => 'Negócio'],
                ['value' => 'study', 'label' => 'Estudos'],
                ['value' => 'default', 'label' => 'Software padrão'],
            ],
        ]);
    }

    public function answer(
        Request $request,
        Project $project,
        MistralClient $mistral,
    ) {
        abort_unless(
            $project->members()->where('user_id', $request->user()->id)->exists(),
            404,
        );

        $data = $request->validate([
            'answer' => ['required', 'string', 'min:1'],
            'history' => ['array'],
            'questionsAsked' => ['nullable', 'integer', 'min:0'],
            'intent' => ['nullable', 'string'],
        ]);

        $chat = $this->resolveChat($project, $request->user()->id);
        $chat
            ->messages()
            ->create($this->buildUserMessagePayload($request, $data['answer']));
        $history = $this->buildHistory($chat);
        $questionsAsked = $chat->questions_asked;

        if (!empty($data['intent'])) {
            $intent = match ($data['intent']) {
                'business' => 'negocio',
                'study' => 'estudos',
                'default' => 'software_padrao',
                default => 'estudos',
            };
            $tags = $project->tags ?? [];
            $tags = array_values(array_unique(array_merge($tags, [$intent])));
            $project->update(['tags' => $tags]);

            $payload = $mistral->nextQuestion($history, $project);
            $message = $payload['message'] ?? $payload['question'] ?? null;
            if (!$message || isset($payload['error'])) {
                return response()->json(['error' => 'ai_unavailable'], 502);
            }

            $questionsAsked++;
            $chat->update([
                'questions_asked' => $questionsAsked,
                'pending_intent_message' => null,
                'pending_intent_options' => null,
            ]);
            $chat
                ->messages()
                ->create($this->buildAssistantMessagePayload($message, $payload['meta'] ?? null));
            $this->logProjectChat($project->id, [
                'action' => 'intent',
                'intent' => $intent,
                'assistant_length' => $this->messageLength($message),
            ]);

            return response()->json([
                'project' => $project->fresh(),
                'needs_more' => true,
                'message' => $message,
                'history' => $this->buildHistory($chat),
                'questionsAsked' => $questionsAsked,
            ]);
        }

        $result = $mistral->reviewAnswer($project, $history);
        if (isset($result['error'])) {
            return response()->json([
                'error' => 'ai_unavailable',
            ], 502);
        }

        if (($result['needs_more'] ?? false) || $questionsAsked < 1) {
            $message = $result['needs_more'] ?? false ? ($result['message'] ?? null) : null;
            $payload = null;

            if (!$message) {
                $payload = $mistral->nextQuestion($history, $project);
                $message = $payload['message'] ?? $payload['question'] ?? null;
            }

            if (!$message || (is_array($payload) && isset($payload['error']))) {
                return response()->json([
                    'error' => 'ai_unavailable',
                ], 502);
            }

            $questionsAsked++;
            $chat->update(['questions_asked' => $questionsAsked]);
            $chat
                ->messages()
                ->create(
                    $this->buildAssistantMessagePayload(
                        $message,
                        $result['meta'] ?? ($payload['meta'] ?? null),
                    ),
                );
            $this->logProjectChat($project->id, [
                'action' => 'follow_up',
                'user_answer_length' => $this->messageLength($data['answer']),
                'assistant_length' => $this->messageLength($message),
            ]);

            return response()->json([
                'project' => $project->fresh(),
                'needs_more' => true,
                'message' => $message,
                'history' => $this->buildHistory($chat),
                'questionsAsked' => $questionsAsked,
            ]);
        }

        $summary = $result['summary'] ?? [];
        if (empty($summary)) {
            return response()->json([
                'error' => 'ai_unavailable',
            ], 502);
        }

        $project->update([
            'overview' => $summary['overview'] ?? $project->overview,
            'purpose' => $summary['purpose'] ?? $project->purpose,
            'scope' => $summary['scope'] ?? $project->scope,
            'target_users' => $summary['target_users'] ?? $project->target_users,
            'nfr_summary' => $summary['nfr_summary'] ?? $project->nfr_summary,
            'status' => 'active',
        ]);
        $chat->update(['status' => 'completed']);

        $this->logProjectChat($project->id, [
            'action' => 'summary',
            'user_answer_length' => $this->messageLength($data['answer']),
            'summary_fields' => array_keys($summary),
        ]);

        if (!empty($summary['overview'])) {
            $chat
                ->messages()
                ->create(
                    $this->buildAssistantMessagePayload(
                        $summary['overview'],
                        $result['meta'] ?? null,
                    ),
                );
        }

        return response()->json([
            'project' => $project->fresh(),
            'summary' => $summary,
            'questionsAsked' => $questionsAsked,
            'history' => $this->buildHistory($chat),
        ]);
    }

    public function finalize(
        Request $request,
        Project $project,
        MistralClient $mistral,
    ) {
        abort_unless(
            $project->members()->where('user_id', $request->user()->id)->exists(),
            404,
        );

        $chat = $this->resolveChat($project, $request->user()->id);
        if ($chat->questions_asked < 1) {
            return response()->json(['error' => 'min_questions'], 422);
        }

        $history = $this->buildHistory($chat);
        $result = $mistral->summarizeNow($project, $history);
        $summary = $result['summary'] ?? [];
        $usedFallback = false;
        if (isset($result['error']) || empty($summary)) {
            $summary = $this->buildFallbackSummary($project, $chat);
            $usedFallback = true;
        }

        $project->update([
            'overview' => $summary['overview'] ?? $project->overview,
            'purpose' => $summary['purpose'] ?? $project->purpose,
            'scope' => $summary['scope'] ?? $project->scope,
            'target_users' => $summary['target_users'] ?? $project->target_users,
            'nfr_summary' => $summary['nfr_summary'] ?? $project->nfr_summary,
            'status' => 'active',
        ]);
        $chat->update(['status' => 'completed']);

        $this->logProjectChat($project->id, [
            'action' => 'finalize',
            'summary_fields' => array_keys($summary),
            'fallback' => $usedFallback,
        ]);

        if (!empty($summary['overview'])) {
            $chat
                ->messages()
                ->create(
                    $this->buildAssistantMessagePayload(
                        $summary['overview'],
                        $result['meta'] ?? null,
                    ),
                );
        }

        return response()->json([
            'project' => $project->fresh(),
            'summary' => $summary,
        ]);
    }

    public function aiChat(
        Request $request,
        Project $project,
        MistralClient $mistral,
    ) {
        abort_unless(
            $project->members()->where('user_id', $request->user()->id)->exists(),
            404,
        );

        $data = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:2000'],
            'history' => ['array'],
            'context' => ['array'],
        ]);

        $contextFlags = is_array($data['context'] ?? null) ? $data['context'] : [];
        $history = $this->sanitizeHistory($data['history'] ?? []);

        $messages = [
            [
                'role' => 'system',
                'content' => 'Você é um assistente de produto e tecnologia. Responda em pt-BR de forma direta, prática e curta. Use o contexto disponível do projeto quando relevante. Evite listas longas e jargões.',
            ],
        ];

        $contextText = $this->buildAiContext($project, $contextFlags);
        if ($contextText) {
            $messages[] = [
                'role' => 'system',
                'content' => "Contexto do projeto:\n".$contextText,
            ];
        }

        $messages = array_merge($messages, $history, [
            ['role' => 'user', 'content' => $data['message']],
        ]);

        $response = $mistral->quickReply($messages, 12);
        if (isset($response['error']) || empty($response['message'])) {
            return response()->json(['error' => 'ai_unavailable'], 502);
        }

        return response()->json([
            'message' => $response['message'],
            'meta' => $response['meta'] ?? null,
        ]);
    }

    private function resolveChat(Project $project, int $userId): Chat
    {
        $chat = $project->chats()->orderBy('created_at')->first();

        if ($chat) {
            return $chat;
        }

        return $project->chats()->create([
            'title' => 'Chat inicial',
            'status' => 'active',
            'created_by' => $userId,
        ]);
    }

    private function makeUniqueSlug(string $slugBase): string
    {
        $slug = $slugBase ?: 'project';
        if (!Project::where('slug', $slug)->exists()) {
            return $slug;
        }

        return $slug.'-'.Str::random(4);
    }

    private function buildHistory(Chat $chat): array
    {
        return $chat
            ->messages()
            ->orderBy('id')
            ->get(['role', 'content'])
            ->map(fn ($message) => [
                'role' => $message->role,
                'content' => $message->content,
            ])
            ->all();
    }

    private function buildUserMessagePayload(Request $request, string $content): array
    {
        return [
            'role' => 'user',
            'user_id' => $request->user()->id,
            'content' => $content,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'client_meta' => $this->buildClientMeta($request),
        ];
    }

    private function buildAssistantMessagePayload(
        string $content,
        ?array $aiMeta = null,
    ): array {
        $payload = [
            'role' => 'assistant',
            'content' => $content,
            'ai_meta' => $aiMeta,
        ];

        return array_filter($payload, fn ($value) => $value !== null);
    }

    private function buildClientMeta(Request $request): array
    {
        $headers = [
            'accept' => $request->header('accept'),
            'accept_encoding' => $request->header('accept-encoding'),
            'accept_language' => $request->header('accept-language'),
            'cache_control' => $request->header('cache-control'),
            'pragma' => $request->header('pragma'),
            'referer' => $request->header('referer'),
            'origin' => $request->header('origin'),
            'sec_ch_ua' => $request->header('sec-ch-ua'),
            'sec_ch_ua_platform' => $request->header('sec-ch-ua-platform'),
            'sec_ch_ua_mobile' => $request->header('sec-ch-ua-mobile'),
            'sec_fetch_site' => $request->header('sec-fetch-site'),
            'sec_fetch_mode' => $request->header('sec-fetch-mode'),
            'sec_fetch_dest' => $request->header('sec-fetch-dest'),
            'sec_fetch_user' => $request->header('sec-fetch-user'),
            'dnt' => $request->header('dnt'),
            'upgrade_insecure_requests' => $request->header(
                'upgrade-insecure-requests',
            ),
            'x_forwarded_for' => $request->header('x-forwarded-for'),
            'x_forwarded_proto' => $request->header('x-forwarded-proto'),
            'x_forwarded_host' => $request->header('x-forwarded-host'),
            'forwarded' => $request->header('forwarded'),
            'cf_connecting_ip' => $request->header('cf-connecting-ip'),
            'true_client_ip' => $request->header('true-client-ip'),
            'x_real_ip' => $request->header('x-real-ip'),
            'host' => $request->header('host'),
        ];

        return [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'path' => $request->path(),
            'locale' => $request->getLocale(),
            'headers' => array_filter(
                $headers,
                fn ($value) => $value !== null && $value !== '',
            ),
        ];
    }

    private function messageLength(?string $message): int
    {
        if (!$message) {
            return 0;
        }

        return function_exists('mb_strlen')
            ? mb_strlen($message)
            : strlen($message);
    }

    private function buildFallbackSummary(Project $project, Chat $chat): array
    {
        $recentUserMessages = $chat
            ->messages()
            ->where('role', 'user')
            ->orderByDesc('id')
            ->limit(3)
            ->pluck('content')
            ->filter()
            ->values()
            ->all();

        $seed = $recentUserMessages[0] ?? $project->purpose ?? $project->name;
        $overview = $project->overview ?: $seed;
        $purpose = $project->purpose ?: $seed;
        $scope = $project->scope ?: 'A definir';

        return [
            'overview' => $overview,
            'purpose' => $purpose,
            'scope' => $scope,
            'target_users' => 'Não informado',
            'nfr_summary' => [],
        ];
    }

    private function logProjectChat(int $projectId, array $payload): void
    {
        try {
            Log::build([
                'driver' => 'single',
                'path' => storage_path("logs/mistral_project_{$projectId}.log"),
                'level' => 'info',
            ])->info('Mistral chat', $payload);
        } catch (\Throwable $th) {
            // ignore logging errors
        }
    }

    private function sanitizeHistory(array $history): array
    {
        $clean = [];
        foreach ($history as $item) {
            $role = $item['role'] ?? '';
            if (!in_array($role, ['user', 'assistant'], true)) {
                continue;
            }
            $content = trim((string) ($item['content'] ?? ''));
            if ($content === '') {
                continue;
            }
            $clean[] = [
                'role' => $role,
                'content' => Str::limit($content, 800, ''),
            ];
        }

        return array_slice($clean, -8);
    }

    private function buildAiContext(Project $project, array $flags): string
    {
        $lines = [];
        $isOn = fn (string $key) => filter_var($flags[$key] ?? false, FILTER_VALIDATE_BOOL);

        if ($isOn('overview') && $project->overview) {
            $lines[] = 'Resumo: '.Str::limit($project->overview, 420, '');
        }
        if ($isOn('purpose') && $project->purpose) {
            $lines[] = 'Missão/Propósito: '.Str::limit($project->purpose, 300, '');
        }
        if ($isOn('scope') && $project->scope) {
            $lines[] = 'Escopo: '.Str::limit($project->scope, 320, '');
        }
        if ($isOn('targetUsers') && $project->target_users) {
            $lines[] = 'Público-alvo: '.Str::limit($project->target_users, 280, '');
        }

        if ($isOn('stack')) {
            $stack = $project->techStackItems()
                ->orderBy('id')
                ->limit(8)
                ->get(['name', 'category', 'version', 'status']);
            if ($stack->isNotEmpty()) {
                $items = $stack->map(function ($item) {
                    $parts = array_filter([$item->category, $item->version, $item->status]);
                    $suffix = $parts ? ' ('.implode(', ', $parts).')' : '';
                    return Str::limit($item->name.$suffix, 80, '');
                })->all();
                $lines[] = 'Stack: '.implode('; ', $items);
            }
        }

        if ($isOn('patterns')) {
            $patterns = $project->architecturePatterns()
                ->orderBy('id')
                ->limit(6)
                ->get(['name', 'status']);
            if ($patterns->isNotEmpty()) {
                $items = $patterns->map(function ($item) {
                    $suffix = $item->status ? ' ('.$item->status.')' : '';
                    return Str::limit($item->name.$suffix, 80, '');
                })->all();
                $lines[] = 'Padrões: '.implode('; ', $items);
            }
        }

        if ($isOn('risks')) {
            $risks = $project->risks()
                ->orderBy('id')
                ->limit(6)
                ->get(['title', 'severity', 'likelihood']);
            if ($risks->isNotEmpty()) {
                $items = $risks->map(function ($item) {
                    $suffix = trim(($item->severity ?? '').' '.$item->likelihood);
                    $suffix = $suffix ? " ({$suffix})" : '';
                    return Str::limit($item->title.$suffix, 90, '');
                })->all();
                $lines[] = 'Riscos: '.implode('; ', $items);
            }
        }

        if ($isOn('integrations')) {
            $links = $project->integrationLinks()
                ->orderBy('id')
                ->limit(6)
                ->get(['label', 'type']);
            if ($links->isNotEmpty()) {
                $items = $links->map(function ($item) {
                    $suffix = $item->type ? ' ('.$item->type.')' : '';
                    return Str::limit($item->label.$suffix, 90, '');
                })->all();
                $lines[] = 'Integrações: '.implode('; ', $items);
            }
        }

        if ($isOn('governance')) {
            $rules = $project->governanceRules()
                ->orderBy('id')
                ->limit(6)
                ->get(['name', 'scope', 'status']);
            if ($rules->isNotEmpty()) {
                $items = $rules->map(function ($item) {
                    $suffix = trim(($item->scope ?? '').' '.($item->status ?? ''));
                    $suffix = $suffix ? " ({$suffix})" : '';
                    return Str::limit($item->name.$suffix, 90, '');
                })->all();
                $lines[] = 'Governança: '.implode('; ', $items);
            }
        }

        if ($isOn('nfrs')) {
            $nfrs = $project->nonFunctionalRequirements()
                ->orderBy('id')
                ->limit(6)
                ->get(['category', 'target', 'priority']);
            if ($nfrs->isNotEmpty()) {
                $items = $nfrs->map(function ($item) {
                    $suffix = trim(($item->target ?? '').' '.($item->priority ?? ''));
                    $suffix = $suffix ? " ({$suffix})" : '';
                    return Str::limit($item->category.$suffix, 90, '');
                })->all();
                $lines[] = 'NFRs: '.implode('; ', $items);
            }
        }

        if ($isOn('decisions')) {
            $decisions = $project->decisionRecords()
                ->orderBy('id')
                ->limit(6)
                ->get(['title', 'status']);
            if ($decisions->isNotEmpty()) {
                $items = $decisions->map(function ($item) {
                    $suffix = $item->status ? ' ('.$item->status.')' : '';
                    return Str::limit($item->title.$suffix, 90, '');
                })->all();
                $lines[] = 'Decisões: '.implode('; ', $items);
            }
        }

        if ($isOn('chatHistory')) {
            $chat = $project->chats()->orderBy('created_at')->first();
            if ($chat) {
                $messages = $chat->messages()->orderBy('id')->limit(8)->get(['role', 'content']);
                if ($messages->isNotEmpty()) {
                    $lines[] = 'Chat inicial:';
                    foreach ($messages as $message) {
                        $role = $message->role === 'assistant' ? 'Assistente' : 'Usuário';
                        $lines[] = $role.': '.Str::limit((string) $message->content, 140, '');
                    }
                }
            }
        }

        return implode("\n", $lines);
    }
}
