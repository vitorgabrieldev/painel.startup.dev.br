<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::select([
            'id',
            'uuid',
            'name',
            'slug',
            'overview',
            'purpose',
            'scope',
            'target_users',
            'status',
            'created_at',
        ])
            ->whereHas('members', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function show(Project $project)
    {
        abort_unless(
            $project->members()->where('user_id', auth()->id())->exists(),
            404,
        );

        $project->load([
            'techStackItems',
            'architecturePatterns',
            'decisionRecords',
            'nonFunctionalRequirements',
            'risks',
            'integrationLinks',
            'playbooks',
            'changeImpacts',
            'governanceRules',
        ]);

        return Inertia::render('Projects/Show', [
            'project' => $project,
        ]);
    }
}
