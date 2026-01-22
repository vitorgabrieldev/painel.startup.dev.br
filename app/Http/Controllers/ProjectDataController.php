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
use Illuminate\Support\Facades\Storage;

class ProjectDataController extends Controller
{
    public function updateProject(Project $project, Request $request)
    {
        $this->assertProjectAccess($project);

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
        $this->assertProjectAccess($project);

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

        return $this->freshProject($project);
    }

    public function updateTechStack(Project $project, TechStackItem $stackItem, Request $request)
    {
        $this->assertProjectAccess($project);

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

        return $this->freshProject($project);
    }

    public function addPattern(Project $project, Request $request)
    {
        $this->assertProjectAccess($project);

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
        $this->assertProjectAccess($project);

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
        $this->assertProjectAccess($project);

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
        $this->assertProjectAccess($project);

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
        $this->assertProjectAccess($project);

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
        $this->assertProjectAccess($project);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'status' => ['required', 'string', 'in:proposed,accepted,superseded,rejected'],
            'context' => ['nullable', 'string'],
            'decision' => ['nullable', 'string'],
        ]);
        $project->decisionRecords()->create($data);

        return $this->freshProject($project);
    }

    public function updateAvatar(Project $project, Request $request)
    {
        $this->assertProjectAccess($project);

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

    private function assertProjectAccess(Project $project): void
    {
        abort_unless(
            $project->members()->where('user_id', auth()->id())->exists(),
            404,
        );
    }
}
