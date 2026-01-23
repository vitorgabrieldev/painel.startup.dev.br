<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ProjectChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private Project $project,
        private User $actor,
        private string $module,
        private string $action,
        private array $meta = [],
    ) {
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'title' => 'Atualização no projeto',
            'message' => sprintf(
                '%s atualizou %s em "%s".',
                $this->actor->name,
                $this->module,
                $this->project->name,
            ),
            'type' => 'project_change',
            'project_id' => $this->project->id,
            'project_uuid' => $this->project->uuid,
            'project_name' => $this->project->name,
            'module' => $this->module,
            'action' => $this->action,
            'meta' => $this->meta,
            'actor' => [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'email' => $this->actor->email,
            ],
            'action_url' => route('projects.show', $this->project),
        ];
    }
}
