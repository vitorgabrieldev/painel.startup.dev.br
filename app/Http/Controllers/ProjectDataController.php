<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithProjectPermissions;
use App\Models\ArchitecturePattern;
use App\Models\DecisionRecord;
use App\Models\GovernanceRule;
use App\Models\IntegrationLink;
use App\Models\NonFunctionalRequirement;
use App\Models\Project;
use App\Models\Risk;
use App\Models\TechStackItem;
use App\Notifications\ProjectChangedNotification;
use App\Services\MistralClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Jobs\GenerateProjectModuleSummary;
use App\Models\ProjectModuleSummary;
use Illuminate\Support\Carbon;

class ProjectDataController extends Controller
{
    use InteractsWithProjectPermissions;

    /**
     * Retorna o resumo IA do módulo do projeto (mais recente do dia).
     */
    public function getModuleSummary(Project $project, $module)
    {
        $this->assertProjectAccess($project);
        $today = Carbon::today();
        $summary = ProjectModuleSummary::where('project_id', $project->id)
            ->where('module', $module)
            ->whereDate('generated_at', $today)
            ->orderByDesc('generated_at')
            ->first();
        if (!$summary) {
            return response()->json([
                'summary' => null,
                'message' => 'Nenhum resumo gerado para este módulo hoje.'
            ], 404);
        }
        $decoded = json_decode($summary->summary, true);
        return response()->json([
            'summary' => $decoded,
            'generated_at' => $summary->generated_at,
        ]);
    }
    use InteractsWithProjectPermissions;

    public function updateProject(Project $project, Request $request)
    {
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'project', 'edit');

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:180'],
            'overview' => ['nullable', 'string'],
            'purpose' => ['nullable', 'string'],
            'scope' => ['nullable', 'string'],
            'target_users' => ['nullable', 'string'],
        ]);

        $project->update($data);

        $this->notifyProjectChange($project, 'project', 'update', ['fields' => array_keys($data)]);

        return $this->freshProject($project);
    }

    public function addTechStack(Project $project, Request $request)
    {
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'stack', 'create');

        $data = $request->validate([
            'category' => ['required', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:180'],
            'version' => ['nullable', 'string', 'max:60'],
            'rationale' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:chosen,evaluating,deprecated'],
            'vendor_url' => ['nullable', 'string', 'max:255'],
            'constraints' => ['nullable', 'string'],
        ]);
        $project->techStackItems()->create($data);

        $this->notifyProjectChange($project, 'stack', 'create', ['name' => $data['name']]);

        $this->dispatchModuleSummaryIfNeeded($project->id, 'stack');

        return $this->freshProject($project);
    }

    public function updateTechStack(Project $project, TechStackItem $stackItem, Request $request)
    {
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'stack', 'edit');

        abort_unless($stackItem->project_id === $project->id, 404);

        $data = $request->validate([
            'category' => ['required', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:180'],
            'version' => ['nullable', 'string', 'max:60'],
            'rationale' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:chosen,evaluating,deprecated'],
            'vendor_url' => ['nullable', 'string', 'max:255'],
            'constraints' => ['nullable', 'string'],
        ]);

        $stackItem->update($data);

        $this->notifyProjectChange($project, 'stack', 'update', ['name' => $data['name']]);

        $this->dispatchModuleSummaryIfNeeded($project->id, 'stack');

        return $this->freshProject($project);
    }

    public function addPattern(Project $project, Request $request)
    {
        $this->dispatchModuleSummaryIfNeeded($project->id, 'patterns');
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'patterns', 'create');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'rationale' => ['nullable', 'string'],
            'constraints' => ['nullable', 'string'],
            'references' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:adopted,evaluating,deprecated'],
        ]);
        $project->architecturePatterns()->create($data);

        $this->notifyProjectChange($project, 'patterns', 'create', ['name' => $data['name']]);

        return $this->freshProject($project);
    }

    public function addRisk(Project $project, Request $request)
    {
        $this->dispatchModuleSummaryIfNeeded($project->id, 'risks');
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'risks', 'create');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'severity' => ['required', 'string', 'in:low,medium,high,critical'],
            'likelihood' => ['required', 'string', 'in:low,medium,high'],
            'impact_area' => ['nullable', 'string', 'max:180'],
            'mitigation' => ['nullable', 'string'],
        ]);
        $project->risks()->create($data);

        $this->notifyProjectChange($project, 'risks', 'create', ['title' => $data['title']]);

        return $this->freshProject($project);
    }

    public function addIntegration(Project $project, Request $request)
    {
        $this->dispatchModuleSummaryIfNeeded($project->id, 'integrations');
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'integrations', 'create');

        $data = $request->validate([
            'type' => ['required', 'string', 'max:80'],
            'label' => ['required', 'string', 'max:180'],
            'url' => ['required', 'url'],
        ]);
        $project->integrationLinks()->create($data);

        $this->notifyProjectChange($project, 'integrations', 'create', ['label' => $data['label']]);

        return $this->freshProject($project);
    }

    public function addGovernance(Project $project, Request $request)
    {
        $this->dispatchModuleSummaryIfNeeded($project->id, 'governance');
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'governance', 'create');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'scope' => ['required', 'string', 'in:decision,process,access'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);
        $project->governanceRules()->create($data);

        $this->notifyProjectChange($project, 'governance', 'create', ['name' => $data['name']]);

        return $this->freshProject($project);
    }

    public function addNfr(Project $project, Request $request)
    {
        $this->dispatchModuleSummaryIfNeeded($project->id, 'nfrs');
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'nfrs', 'create');

        $data = $request->validate([
            'category' => ['required', 'string', 'max:120'],
            'metric' => ['nullable', 'string', 'max:120'],
            'target' => ['nullable', 'string', 'max:180'],
            'priority' => ['required', 'string', 'in:low,medium,high'],
            'rationale' => ['nullable', 'string'],
            'current_assessment' => ['nullable', 'string'],
        ]);
        $project->nonFunctionalRequirements()->create($data);

        $this->notifyProjectChange($project, 'nfrs', 'create', ['category' => $data['category']]);

        return $this->freshProject($project);
    }

    public function addDecision(Project $project, Request $request)
    {
        $this->dispatchModuleSummaryIfNeeded($project->id, 'decisions');
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'decisions', 'create');

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'status' => ['required', 'string', 'in:proposed,accepted,superseded,rejected'],
            'context' => ['nullable', 'string'],
            'decision' => ['nullable', 'string'],
        ]);
        $project->decisionRecords()->create($data);

        $this->notifyProjectChange($project, 'decisions', 'create', ['title' => $data['title']]);

        return $this->freshProject($project);
    }

    public function updateAvatar(Project $project, Request $request)
    {
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'project', 'edit');

        $validated = $request->validate([
            'avatar' => ['nullable', 'image', 'max:2048'],
            'avatar_remove' => ['nullable', 'boolean'],
        ]);

        if (!empty($validated['avatar_remove']) && $project->avatar_path) {
            Storage::disk('public')->delete($project->avatar_path);
            $project->avatar_path = null;
        }

        if ($request->hasFile('avatar')) {
            if ($project->avatar_path) {
                Storage::disk('public')->delete($project->avatar_path);
            }
            $path = $request->file('avatar')->store('project-avatars', 'public');
            $project->avatar_path = $path;
        }

        $project->save();

        $this->notifyProjectChange($project, 'project', 'update_avatar');

        return $this->freshProject($project);
    }

    public function generateAiData(
        Project $project,
        Request $request,
        MistralClient $mistral,
    ) {
        $this->assertProjectAccess($project);

        $project->load([
            'techStackItems',
            'architecturePatterns',
            'integrationLinks',
            'nonFunctionalRequirements',
        ]);

        $data = $request->validate([
            'module' => ['required', 'string', 'in:stack,patterns,integrations,nfrs'],
            'dry_run' => ['nullable', 'boolean'],
        ]);

        $module = $data['module'];
        $contextText = $this->buildAiContext($project);
        $existing = $this->existingItems($project, $module);
        $prompt = $this->buildAiPrompt($module, $contextText, $existing);

        $messages = [
            [
                'role' => 'system',
                'content' => 'Você é um assistente de produto e tecnologia. Responda em pt-BR, direto e prático. Retorne apenas JSON válido no formato pedido, sem markdown.',
            ],
            [
                'role' => 'user',
                'content' => $prompt,
            ],
        ];

        $response = $mistral->structuredReply($messages, 18);
        if (isset($response['error'])) {
            return response()->json(['error' => 'ai_unavailable'], 502);
        }

        $raw = $response['data'] ?? [];
        $items = $this->extractItems($raw);
        $prepared = $this->prepareAiItems($project, $module, $items);

        if (!empty($data['dry_run'])) {
            return response()->json([
                'items' => $prepared,
            ]);
        }

        $created = $this->storePreparedItems($project, $module, $prepared);

        return response()->json([
            'project' => $this->freshProject($project),
            'created' => $created,
        ]);
    }

    private function freshProject(Project $project)
    {
        return $project->fresh()->load([
            'techStackItems',
            'architecturePatterns',
            'decisionRecords',
            'nonFunctionalRequirements',
            'risks',
            'integrationLinks',
            'governanceRules',
        ]);
    }

    private function notifyProjectChange(Project $project, string $module, string $action, array $meta = []): void
    {
        $project->loadMissing('members.user');
        $recipients = $project->members->map->user->filter();
        if ($recipients->isEmpty()) {
            return;
        }

        NotificationFacade::send(
            $recipients,
            new ProjectChangedNotification($project, auth()->user(), $module, $action, $meta),
        );
    }

    private function buildAiContext(Project $project): string
    {
        $lines = [];
        $lines[] = 'Nome: '.$project->name;
        $lines[] = 'Resumo: '.($project->overview ?: 'Não informado');
        $lines[] = 'Propósito: '.($project->purpose ?: 'Não informado');
        $lines[] = 'Escopo: '.($project->scope ?: 'Não informado');
        $lines[] = 'Público-alvo: '.($project->target_users ?: 'Não informado');

        $stack = $project->techStackItems->pluck('name')->filter()->values()->all();
        if ($stack) {
            $lines[] = 'Stack atual: '.implode(', ', $stack);
        }

        $patterns = $project->architecturePatterns->pluck('name')->filter()->values()->all();
        if ($patterns) {
            $lines[] = 'Padrões atuais: '.implode(', ', $patterns);
        }

        $integrations = $project->integrationLinks->pluck('label')->filter()->values()->all();
        if ($integrations) {
            $lines[] = 'Integrações atuais: '.implode(', ', $integrations);
        }

        $nfrs = $project->nonFunctionalRequirements
            ->map(fn ($nfr) => trim($nfr->category.' '.$nfr->metric))
            ->filter()
            ->values()
            ->all();
        if ($nfrs) {
            $lines[] = 'NFRs atuais: '.implode(', ', $nfrs);
        }

        return implode("\n", $lines);
    }

    private function buildAiPrompt(string $module, string $contextText, array $existing): string
    {
        $existingText = $existing ? implode(', ', $existing) : 'Nenhum';
        $base = "Contexto do projeto:\n{$contextText}\n\nItens existentes: {$existingText}.\n";

        return match ($module) {
            'stack' => $base
                ."Gere uma lista de stack técnica inicial (4 a 8 itens, apenas se fizer sentido). "
                ."Não repita itens existentes. Retorne JSON no formato "
                .'{"items":[{"category":"","name":"","version":"","status":"","rationale":"","vendor_url":"","constraints":""}]} '
                ."Status deve ser chosen|evaluating|deprecated. Se não souber versão ou URL, deixe vazio.",
            'patterns' => $base
                ."Gere uma lista de padrões de arquitetura (3 a 6 itens). Não repita itens existentes. "
                ."Retorne JSON no formato "
                .'{"items":[{"name":"","status":"","rationale":"","constraints":"","references":""}]} '
                ."Status deve ser adopted|evaluating|deprecated. Use referências curtas se souber.",
            'integrations' => $base
                ."Gere integrações e links úteis (3 a 6 itens). Não repita itens existentes. "
                ."Retorne JSON no formato "
                .'{"items":[{"type":"","label":"","url":"","notes":""}]} '
                ."URL deve ser válida (https://...). Se não tiver URL real, não inclua o item.",
            'nfrs' => $base
                ."Gere NFRs e metas de qualidade (4 a 7 itens). Não repita itens existentes. "
                ."Retorne JSON no formato "
                .'{"items":[{"category":"","metric":"","target":"","priority":"","rationale":"","current_assessment":""}]} '
                ."Priority deve ser low|medium|high.",
            default => $base,
        };
    }

    private function extractItems(array $payload): array
    {
        if (isset($payload['items']) && is_array($payload['items'])) {
            return $payload['items'];
        }
        if (array_is_list($payload)) {
            return $payload;
        }
        return [];
    }

    private function prepareAiItems(Project $project, string $module, array $items): array
    {
        $normalizedExisting = collect($this->existingItems($project, $module))
            ->map(fn ($value) => $this->normalizeKey($value))
            ->filter()
            ->values()
            ->all();

        $preparedList = [];
        foreach (array_slice($items, 0, 10) as $item) {
            if (!is_array($item)) {
                continue;
            }

            $prepared = match ($module) {
                'stack' => $this->prepareStackItem($item, $normalizedExisting),
                'patterns' => $this->preparePatternItem($item, $normalizedExisting),
                'integrations' => $this->prepareIntegrationItem($item, $normalizedExisting),
                'nfrs' => $this->prepareNfrItem($item, $normalizedExisting),
                default => null,
            };

            if (!$prepared) {
                continue;
            }

            $preparedList[] = $prepared;
        }

        return $preparedList;
    }

    private function storePreparedItems(Project $project, string $module, array $items): int
    {
        $count = 0;

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            match ($module) {
                'stack' => $project->techStackItems()->create($item),
                'patterns' => $project->architecturePatterns()->create($item),
                'integrations' => $project->integrationLinks()->create($item),
                'nfrs' => $project->nonFunctionalRequirements()->create($item),
                default => null,
            };

            $count++;
        }

        return $count;
    }

    private function existingItems(Project $project, string $module): array
    {
        return match ($module) {
            'stack' => $project->techStackItems->pluck('name')->filter()->values()->all(),
            'patterns' => $project->architecturePatterns->pluck('name')->filter()->values()->all(),
            'integrations' => $project->integrationLinks->pluck('label')->filter()->values()->all(),
            'nfrs' => $project->nonFunctionalRequirements
                ->map(fn ($nfr) => trim($nfr->category.' '.$nfr->metric))
                ->filter()
                ->values()
                ->all(),
            default => [],
        };
    }

    private function normalizeKey(?string $value): string
    {
        if (!$value) {
            return '';
        }
        return Str::lower(trim($value));
    }

    private function prepareStackItem(array $item, array $existing): ?array
    {
        $name = trim((string) ($item['name'] ?? ''));
        if ($name === '' || in_array($this->normalizeKey($name), $existing, true)) {
            return null;
        }

        $status = $item['status'] ?? 'chosen';
        $status = in_array($status, ['chosen', 'evaluating', 'deprecated'], true)
            ? $status
            : 'chosen';

        $data = [
            'category' => trim((string) ($item['category'] ?? 'Geral')) ?: 'Geral',
            'name' => $name,
            'version' => trim((string) ($item['version'] ?? '')) ?: null,
            'rationale' => $this->normalizeOptionalText($item['rationale'] ?? null),
            'status' => $status,
            'vendor_url' => $this->normalizeOptionalText($item['vendor_url'] ?? null),
            'constraints' => $this->normalizeOptionalText($item['constraints'] ?? null),
        ];

        return $this->validateItem($data, [
            'category' => ['required', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:180'],
            'version' => ['nullable', 'string', 'max:60'],
            'rationale' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:chosen,evaluating,deprecated'],
            'vendor_url' => ['nullable', 'string', 'max:255'],
            'constraints' => ['nullable', 'string'],
        ]);
    }

    private function preparePatternItem(array $item, array $existing): ?array
    {
        $name = trim((string) ($item['name'] ?? ''));
        if ($name === '' || in_array($this->normalizeKey($name), $existing, true)) {
            return null;
        }

        $status = $item['status'] ?? 'adopted';
        $status = in_array($status, ['adopted', 'evaluating', 'deprecated'], true)
            ? $status
            : 'adopted';

        $data = [
            'name' => $name,
            'rationale' => $this->normalizeOptionalText($item['rationale'] ?? null),
            'constraints' => $this->normalizeOptionalText($item['constraints'] ?? null),
            'references' => $this->normalizeOptionalText($item['references'] ?? null),
            'status' => $status,
        ];

        return $this->validateItem($data, [
            'name' => ['required', 'string', 'max:180'],
            'rationale' => ['nullable', 'string'],
            'constraints' => ['nullable', 'string'],
            'references' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:adopted,evaluating,deprecated'],
        ]);
    }

    private function prepareIntegrationItem(array $item, array $existing): ?array
    {
        $label = trim((string) ($item['label'] ?? ''));
        if ($label === '' || in_array($this->normalizeKey($label), $existing, true)) {
            return null;
        }

        $data = [
            'type' => trim((string) ($item['type'] ?? 'Link')) ?: 'Link',
            'label' => $label,
            'url' => trim((string) ($item['url'] ?? '')),
            'notes' => $this->normalizeOptionalText($item['notes'] ?? null),
        ];

        return $this->validateItem($data, [
            'type' => ['required', 'string', 'max:80'],
            'label' => ['required', 'string', 'max:180'],
            'url' => ['required', 'url'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function prepareNfrItem(array $item, array $existing): ?array
    {
        $category = trim((string) ($item['category'] ?? ''));
        $metric = trim((string) ($item['metric'] ?? ''));
        $key = trim($category.' '.$metric);
        if ($category === '' || in_array($this->normalizeKey($key), $existing, true)) {
            return null;
        }

        $priority = $item['priority'] ?? 'medium';
        $priority = in_array($priority, ['low', 'medium', 'high'], true)
            ? $priority
            : 'medium';

        $data = [
            'category' => $category,
            'metric' => $metric ?: null,
            'target' => $this->normalizeOptionalText($item['target'] ?? null),
            'priority' => $priority,
            'rationale' => $this->normalizeOptionalText($item['rationale'] ?? null),
            'current_assessment' => $this->normalizeOptionalText($item['current_assessment'] ?? null),
        ];

        return $this->validateItem($data, [
            'category' => ['required', 'string', 'max:120'],
            'metric' => ['nullable', 'string', 'max:120'],
            'target' => ['nullable', 'string', 'max:180'],
            'priority' => ['required', 'string', 'in:low,medium,high'],
            'rationale' => ['nullable', 'string'],
            'current_assessment' => ['nullable', 'string'],
        ]);
    }

    private function normalizeOptionalText($value): ?string
    {
        if ($value === null) {
            return null;
        }
        if (is_array($value)) {
            $value = implode(', ', array_filter(array_map('trim', $value)));
        }
        $text = trim((string) $value);
        return $text === '' ? null : $text;
    }

    private function validateItem(array $data, array $rules): ?array
    {
        $validator = validator($data, $rules);
        if ($validator->fails()) {
            return null;
        }
        return $validator->validated();
    }

    private function assertProjectAccess(Project $project): void
    {
        abort_unless(
            $project->members()->where('user_id', auth()->id())->exists(),
            404,
        );
    }

    /**
     * Dispara o job de resumo IA se não houver um gerado hoje para o módulo.
     */
    private function dispatchModuleSummaryIfNeeded($projectId, $module)
    {
        $today = Carbon::today();
        $lastSummary = ProjectModuleSummary::where('project_id', $projectId)
            ->where('module', $module)
            ->whereDate('generated_at', $today)
            ->first();
        if (!$lastSummary) {
            GenerateProjectModuleSummary::dispatch($projectId, $module);
        }
    }
}
