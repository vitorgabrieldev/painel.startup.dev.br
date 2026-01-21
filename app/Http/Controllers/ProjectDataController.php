<?php

namespace App\Http\Controllers;

use App\Models\ArchitecturePattern;
use App\Models\DecisionRecord;
use App\Models\GovernanceRule;
use App\Models\IntegrationLink;
use App\Models\NonFunctionalRequirement;
use App\Models\Project;
use App\Models\Risk;
use App\Models\TechStackItem;
use Illuminate\Http\Request;

class ProjectDataController extends Controller
{
    public function updateProject(Project $project, Request $request)
    {
        $data = $request->validate([
            'overview' => ['nullable', 'string'],
            'purpose' => ['nullable', 'string'],
            'scope' => ['nullable', 'string'],
            'target_users' => ['nullable', 'string'],
        ]);

        $project->update($data);

        return $this->freshProject($project);
    }

    public function addTechStack(Project $project, Request $request)
    {
        $data = $request->validate([
            'category' => ['required', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:180'],
            'version' => ['nullable', 'string', 'max:60'],
            'rationale' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:chosen,evaluating,deprecated'],
        ]);
        $project->techStackItems()->create($data);

        return $this->freshProject($project);
    }

    public function addPattern(Project $project, Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'rationale' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:adopted,evaluating,deprecated'],
        ]);
        $project->architecturePatterns()->create($data);

        return $this->freshProject($project);
    }

    public function addRisk(Project $project, Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'severity' => ['required', 'string', 'in:low,medium,high,critical'],
            'likelihood' => ['required', 'string', 'in:low,medium,high'],
            'impact_area' => ['nullable', 'string', 'max:180'],
            'mitigation' => ['nullable', 'string'],
        ]);
        $project->risks()->create($data);

        return $this->freshProject($project);
    }

    public function addIntegration(Project $project, Request $request)
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'max:80'],
            'label' => ['required', 'string', 'max:180'],
            'url' => ['required', 'url'],
        ]);
        $project->integrationLinks()->create($data);

        return $this->freshProject($project);
    }

    public function addGovernance(Project $project, Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'scope' => ['required', 'string', 'in:decision,process,access'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);
        $project->governanceRules()->create($data);

        return $this->freshProject($project);
    }

    public function addNfr(Project $project, Request $request)
    {
        $data = $request->validate([
            'category' => ['required', 'string', 'max:120'],
            'metric' => ['nullable', 'string', 'max:120'],
            'target' => ['nullable', 'string', 'max:180'],
            'priority' => ['required', 'string', 'in:low,medium,high'],
            'rationale' => ['nullable', 'string'],
        ]);
        $project->nonFunctionalRequirements()->create($data);

        return $this->freshProject($project);
    }

    public function addDecision(Project $project, Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'status' => ['required', 'string', 'in:proposed,accepted,superseded,rejected'],
            'context' => ['nullable', 'string'],
            'decision' => ['nullable', 'string'],
        ]);
        $project->decisionRecords()->create($data);

        return $this->freshProject($project);
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
}
