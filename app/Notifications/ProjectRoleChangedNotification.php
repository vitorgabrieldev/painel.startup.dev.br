<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ProjectRoleChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Project $project,
        private User $actor,
        private string $role,
    ) {
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'title' => 'Permissão atualizada',
            'message' => sprintf(
                'Seu papel no projeto "%s" agora é %s.',
                $this->project->name,
                ucfirst($this->role),
            ),
            'type' => 'project_role_change',
            'project_id' => $this->project->id,
            'project_uuid' => $this->project->uuid,
            'project_name' => $this->project->name,
            'role' => $this->role,
            'actor' => [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'email' => $this->actor->email,
            ],
            'action_url' => route('projects.show', $this->project),
        ];
    }
}
