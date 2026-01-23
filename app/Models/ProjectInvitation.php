<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ProjectInvitation extends Model
{
    protected $fillable = [
        'project_id',
        'inviter_id',
        'invited_user_id',
        'email',
        'status',
        'token',
        'responded_at',
    ];

    protected static function booted()
    {
        static::creating(function (self $invitation) {
            $invitation->token = $invitation->token ?: Str::uuid()->toString();
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    public function invited(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }
}
