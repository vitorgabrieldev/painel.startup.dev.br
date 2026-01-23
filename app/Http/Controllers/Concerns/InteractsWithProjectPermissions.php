<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Project;
use App\Support\ProjectPermissions;

trait InteractsWithProjectPermissions
{
    private function userRole(Project $project): string
    {
        return strtolower(
            $project
                ->members()
                ->where('user_id', auth()->id())
                ->value('role') ?? 'user',
        );
    }

    private function assertProjectPermission(Project $project, string $module, string $action): void
    {
        $role = $this->userRole($project);
        abort_unless(
            ProjectPermissions::allows($role, $module, $action),
            401,
        );
    }
}
