<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\ProjectMember;
use App\Models\User;
use App\Notifications\ProjectInvitationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ProjectInvitationController extends Controller
{
    public function store(Project $project, Request $request): JsonResponse
    {
        $this->authorizeOwner($project);

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
            return response()->json(['error' => 'invite_already_sent'], 422);
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
            ['role' => 'member'],
        );

        $invitation->update([
            'status' => 'accepted',
            'responded_at' => now(),
        ]);

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
