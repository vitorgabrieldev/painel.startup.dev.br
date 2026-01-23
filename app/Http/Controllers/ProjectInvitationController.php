<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithProjectPermissions;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\ProjectMember;
use App\Models\Notification;
use App\Models\User;
use App\Notifications\ProjectInvitationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ProjectInvitationController extends Controller
{
    use InteractsWithProjectPermissions;

    public function store(Project $project, Request $request): JsonResponse
    {
        $this->authorizeOwner($project);
        $this->assertProjectPermission($project, 'invites', 'create');

        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $invitee = User::where('email', $data['email'])->first();
        if (!$invitee) {
            return response()->json(['error' => 'user_not_found'], 422);
        }

        // Avoid duplicates
        $existing = ProjectInvitation::where('project_id', $project->id)
            ->where('invited_user_id', $invitee->id)
            ->where('status', 'pending')
            ->first();
        if ($existing) {
            Notification::where('notifiable_id', $invitee->id)
                ->where('notifiable_type', get_class($invitee))
                ->where('data->type', 'project_invite')
                ->where(function ($query) use ($existing) {
                    $query->where('data->invite_id', (string) $existing->id)
                        ->orWhere('data->invite_id', $existing->id);
                })
                ->delete();

            $existing->delete();
        }

        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'inviter_id' => $request->user()->id,
            'invited_user_id' => $invitee->id,
            'email' => $invitee->email,
            'status' => 'pending',
            'token' => Str::uuid(),
        ]);

        $invitee->notify(new ProjectInvitationNotification($project, $request->user(), (string) $invitation->id));

        return response()->json([
            'invitation' => $invitation,
        ]);
    }

    public function accept(ProjectInvitation $invitation, Request $request): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request);

        if ($invitation->status !== 'pending') {
            return response()->json(['error' => 'already_processed'], 422);
        }

        ProjectMember::firstOrCreate(
            [
                'project_id' => $invitation->project_id,
                'user_id' => $invitation->invited_user_id,
            ],
            ['role' => 'user'],
        );

        $invitation->update([
            'status' => 'accepted',
            'responded_at' => now(),
        ]);

        Notification::where('notifiable_id', $request->user()->id)
            ->where('notifiable_type', get_class($request->user()))
            ->where('data->type', 'project_invite')
            ->where(function ($query) use ($invitation) {
                $query->where('data->invite_id', (string) $invitation->id)
                    ->orWhere('data->invite_id', $invitation->id);
            })
            ->delete();

        return response()->json(['ok' => true]);
    }

    public function reject(ProjectInvitation $invitation, Request $request): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request);

        if ($invitation->status !== 'pending') {
            return response()->json(['error' => 'already_processed'], 422);
        }

        $invitation->update([
            'status' => 'rejected',
            'responded_at' => now(),
        ]);

        Notification::where('notifiable_id', $request->user()->id)
            ->where('notifiable_type', get_class($request->user()))
            ->where('data->type', 'project_invite')
            ->where(function ($query) use ($invitation) {
                $query->where('data->invite_id', (string) $invitation->id)
                    ->orWhere('data->invite_id', $invitation->id);
            })
            ->delete();

        return response()->json(['ok' => true]);
    }

    private function authorizeOwner(Project $project): void
    {
        abort_unless(
            $project
                ->members()
                ->where('user_id', Auth::id())
                ->where('role', 'owner')
                ->exists(),
            403,
        );
    }

    private function authorizeInvitation(ProjectInvitation $invitation, Request $request): void
    {
        abort_unless($invitation->invited_user_id === $request->user()->id, 404);
    }
}
