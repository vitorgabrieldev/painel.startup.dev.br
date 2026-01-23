<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'title' => 'Bem-vindo ao Safio!',
            'message' => 'Comece criando um projeto ou importando seu contexto. Qualquer dúvida, abra o chat da IA.',
            'action_url' => route('dashboard'),
        ];
    }
}
