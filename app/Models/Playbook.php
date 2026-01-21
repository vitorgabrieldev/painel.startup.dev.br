<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Playbook extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'category',
        'summary',
        'content',
        'is_global',
    ];

    protected $casts = [
        'is_global' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
