<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ProjectInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Project $project,
        private User $inviter,
        private string $inviteId,
        private string $message = 'Você foi convidado para colaborar em um projeto.',
    ) {
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'title' => 'Convite para projeto',
            'message' => $this->message,
            'type' => 'project_invite',
            'invite_id' => $this->inviteId,
            'project_id' => $this->project->id,
            'project_name' => $this->project->name,
            'inviter' => [
                'id' => $this->inviter->id,
                'name' => $this->inviter->name,
                'email' => $this->inviter->email,
            ],
            'action_url' => route('projects.show', $this->project),
        ];
    }
}
