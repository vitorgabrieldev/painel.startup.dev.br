<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::query()
            ->where('notifiable_id', $request->user()->id)
            ->where('notifiable_type', get_class($request->user()))
            ->orderByDesc('created_at')
            ->limit(25)
            ->get()
            ->map(function (Notification $notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->data['title'] ?? 'Notificação',
                    'message' => $notification->data['message'] ?? '',
                    'action_url' => $notification->data['action_url'] ?? null,
                    'type' => $notification->data['type'] ?? null,
                    'data' => $notification->data ?? [],
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                ];
            });

        $unreadCount = Notification::query()
            ->where('notifiable_id', $request->user()->id)
            ->where('notifiable_type', get_class($request->user()))
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::query()
            ->where('notifiable_id', $request->user()->id)
            ->where('notifiable_type', get_class($request->user()))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    public function deleteAll(Request $request): JsonResponse
    {
        Notification::query()
            ->where('notifiable_id', $request->user()->id)
            ->where('notifiable_type', get_class($request->user()))
            ->delete();

        return response()->json(['ok' => true]);
    }

    public function markRead(Notification $notification, Request $request): JsonResponse
    {
        $this->authorizeNotification($notification, $request);
        if (!$notification->read_at) {
            $notification->update(['read_at' => now()]);
        }

        return response()->json(['ok' => true]);
    }

    public function delete(Notification $notification, Request $request): JsonResponse
    {
        $this->authorizeNotification($notification, $request);
        $notification->delete();

        return response()->json(['ok' => true]);
    }

    private function authorizeNotification(Notification $notification, Request $request): void
    {
        abort_unless(
            $notification->notifiable_id === $request->user()->id &&
                $notification->notifiable_type === get_class($request->user()),
            404,
        );
    }
}
