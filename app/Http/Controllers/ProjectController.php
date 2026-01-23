<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::select([
            'projects.id',
            'projects.uuid',
            'projects.name',
            'projects.slug',
            'projects.overview',
            'projects.purpose',
            'projects.scope',
            'projects.target_users',
            'projects.status',
            'projects.created_at',
            'projects.updated_at',
            'projects.avatar_path',
            'pm.role as member_role',
        ])
            ->join('project_members as pm', 'pm.project_id', '=', 'projects.id')
            ->where('pm.user_id', auth()->id())
            ->orderByDesc('projects.created_at')
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
            'members.user',
        ]);

        $role = $project
            ->members()
            ->where('user_id', auth()->id())
            ->value('role') ?? 'user';

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'role' => $role,
            'permissions' => \App\Support\ProjectPermissions::abilitiesForRole($role),
            'available_roles' => \App\Support\ProjectPermissions::availableRoles(),
        ]);
    }
}
