<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Project;
use Inertia\Inertia;

class ChatController extends Controller
{
    public function show(Project $project)
    {
        abort_unless(
            $project->members()->where('user_id', auth()->id())->exists(),
            404,
        );

        $chat = $project->chats()->orderBy('created_at')->first();
        if (!$chat) {
            $chat = $project->chats()->create([
                'title' => 'Chat inicial',
                'status' => 'active',
                'created_by' => auth()->id(),
            ]);
        }
        $messages = $chat
            ->messages()
            ->orderBy('id')
            ->get(['id', 'role', 'content', 'created_at']);

        return Inertia::render('Dashboard', [
            'projects' => [],
            'chatOnly' => true,
            'chatProject' => $project->only([
                'id',
                'uuid',
                'name',
                'slug',
                'overview',
                'purpose',
                'scope',
                'target_users',
                'status',
                'created_at',
            ]),
            'chatMessages' => $messages->map(fn ($message) => [
                'id' => $message->id,
                'author' => $message->role === 'user' ? 'user' : 'assistant',
                'content' => $message->content,
                'timestamp' => optional($message->created_at)->toISOString(),
            ]),
            'chatHistory' => $messages->map(fn ($message) => [
                'role' => $message->role,
                'content' => $message->content,
            ]),
            'chatQuestionsAsked' => $chat->questions_asked,
            'chatPendingIntent' => $chat->pending_intent_message,
            'chatIntentOptions' => $chat->pending_intent_options ?? [],
        ]);
    }
}
