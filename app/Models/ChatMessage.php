<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $fillable = [
        'chat_id',
        'user_id',
        'role',
        'content',
        'meta',
        'ip_address',
        'user_agent',
        'client_meta',
        'ai_meta',
    ];

    protected $casts = [
        'content' => 'encrypted',
        'meta' => 'encrypted:array',
        'ip_address' => 'encrypted',
        'user_agent' => 'encrypted',
        'client_meta' => 'encrypted:array',
        'ai_meta' => 'encrypted:array',
    ];

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
