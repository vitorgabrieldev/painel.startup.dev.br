<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function show(Project $project)
    {
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
