<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $projects = Project::select([
            'id',
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

        return Inertia::render('Dashboard', [
            'projects' => $projects,
        ]);
    }
}
