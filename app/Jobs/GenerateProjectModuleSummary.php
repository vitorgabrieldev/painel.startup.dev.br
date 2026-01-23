<?php

namespace App\Jobs;

use App\Models\Project;
use App\Models\ProjectModuleSummary;
use App\Services\MistralClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class GenerateProjectModuleSummary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;
    public $timeout = 60;

    public function __construct(
        public int $projectId,
        public string $module
    ) {}

    public function handle(MistralClient $mistral)
    {
        $project = Project::findOrFail($this->projectId);
        // Montar contexto e prompt
        $context = "Nome: {$project->name}\n";
        $context .= "Resumo: ".($project->overview ?: 'Não informado')."\n";
        $context .= "Propósito: ".($project->purpose ?: 'Não informado')."\n";
        $context .= "Escopo: ".($project->scope ?: 'Não informado')."\n";
        $context .= "Público-alvo: ".($project->target_users ?: 'Não informado')."\n";
        $existing = [];
        if ($this->module === 'stack') $existing = $project->techStackItems->pluck('name')->all();
        if ($this->module === 'patterns') $existing = $project->architecturePatterns->pluck('name')->all();
        if ($this->module === 'risks') $existing = $project->risks->pluck('title')->all();
        if ($this->module === 'integrations') $existing = $project->integrationLinks->pluck('label')->all();
        if ($this->module === 'governance') $existing = $project->governanceRules->pluck('name')->all();
        if ($this->module === 'nfrs') $existing = $project->nonFunctionalRequirements->pluck('category')->all();
        if ($this->module === 'decisions') $existing = $project->decisionRecords->pluck('title')->all();
        $existingText = $existing ? implode(', ', $existing) : 'Nenhum';
        $prompt = "Contexto do projeto:\n{$context}\nItens existentes: {$existingText}.\nGere um resumo do módulo '{$this->module}' para o time, em pt-BR, objetivo, prático e sem markdown, focando em como esses itens suportam o sucesso do projeto, forneça dicas, sugestões, melhores práticas e pontos de atenção relevantes, focando em uma linguagem clara e direta. Retorne apenas o resumo gerado, porém caso um detalhe for importante e de grade atenção, inclua no resumo.";
        $messages = [
            ['role' => 'system', 'content' => 'Você é um assistente de produto e tecnologia. Responda em pt-BR, direto e prático.'],
            ['role' => 'user', 'content' => $prompt],
        ];
        $response = $mistral->structuredReply($messages, 18);
        $summary = $response['data']['summary'] ?? ($response['data'] ?? null) ?? 'Resumo não disponível.';
        if (is_array($summary)) {
            $summary = json_encode($summary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
        ProjectModuleSummary::updateOrCreate(
            [
                'project_id' => $project->id,
                'module' => $this->module,
            ],
            [
                'summary' => $summary,
                'generated_at' => Carbon::now(),
            ]
        );
    }
}
