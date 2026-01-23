<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithProjectPermissions;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Support\ProjectPermissions;
use App\Notifications\ProjectRoleChangedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    use InteractsWithProjectPermissions;

    public function update(Project $project, ProjectMember $member, Request $request): JsonResponse
    {
        $this->assertProjectAccess($project);
        $this->assertProjectPermission($project, 'members', 'manage');

        abort_unless($member->project_id === $project->id, 404);
        abort_if($member->user_id === auth()->id(), 403, 'cannot_change_self');

        $data = $request->validate([
            'role' => ['required', 'string', 'in:' . implode(',', ProjectPermissions::availableRoles())],
        ]);

        $member->update(['role' => $data['role']]);

        $member->loadMissing('user');
        if ($member->user) {
            $member->user->notify(new ProjectRoleChangedNotification($project, $request->user(), $member->role));
        }

        return response()->json([
            'member' => $member->load('user'),
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
