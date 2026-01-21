<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Chat extends Model
{
    protected $fillable = [
        'project_id',
        'uuid',
        'title',
        'status',
        'questions_asked',
        'pending_intent_message',
        'pending_intent_options',
        'created_by',
    ];

    protected $casts = [
        'pending_intent_message' => 'encrypted',
        'pending_intent_options' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Chat $chat) {
            if (!$chat->uuid) {
                $chat->uuid = (string) Str::uuid();
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }
}
