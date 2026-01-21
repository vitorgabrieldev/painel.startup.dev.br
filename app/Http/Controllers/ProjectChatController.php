<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\MistralClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProjectChatController extends Controller
{
    public function start(Request $request, MistralClient $mistral)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'min:1'],
            'history' => ['array'],
        ]);

        $name = Str::limit(Str::headline($data['message']), 60, '');
        $slugBase = Str::slug($name ?: 'project');
        $slug = $slugBase ?: 'project';

        if (Project::where('slug', $slug)->exists()) {
            $slug = $slugBase.'-'.Str::random(4);
        }

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

        $history = $data['history'] ?? [];
        $history[] = ['role' => 'user', 'content' => $data['message']];

        $message =
            'Este projeto é para negócio, estudos ou é um software padrão (uso geral)?';
        $history[] = ['role' => 'assistant', 'content' => $message];
        $this->logProjectChat($project->id, [
            'action' => 'start',
            'user_message' => $data['message'],
            'assistant' => $message,
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
        $data = $request->validate([
            'answer' => ['required', 'string', 'min:1'],
            'history' => ['array'],
            'questionsAsked' => ['nullable', 'integer', 'min:0'],
            'intent' => ['nullable', 'string'],
        ]);

        $history = $data['history'] ?? [];
        $questionsAsked = (int) ($data['questionsAsked'] ?? 0);

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
            $this->logProjectChat($project->id, [
                'action' => 'intent',
                'intent' => $intent,
                'assistant' => $message,
            ]);

            return response()->json([
                'project' => $project->fresh(),
                'needs_more' => true,
                'message' => $message,
                'history' => $history,
                'questionsAsked' => $questionsAsked,
            ]);
        }

        $result = $mistral->reviewAnswer($project, $history);
        if (isset($result['error'])) {
            return response()->json([
                'error' => 'ai_unavailable',
            ], 502);
        }

        if (($result['needs_more'] ?? false) || $questionsAsked < 5) {
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
            $this->logProjectChat($project->id, [
                'action' => 'follow_up',
                'user_answer' => $data['answer'],
                'assistant' => $message,
            ]);

            return response()->json([
                'project' => $project->fresh(),
                'needs_more' => true,
                'message' => $message,
                'history' => $history,
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

        $this->logProjectChat($project->id, [
            'action' => 'summary',
            'user_answer' => $data['answer'],
            'summary' => $summary,
        ]);

        return response()->json([
            'project' => $project->fresh(),
            'summary' => $summary,
            'questionsAsked' => $questionsAsked,
        ]);
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
}
