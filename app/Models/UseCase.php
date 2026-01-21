<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UseCase extends Model
{
    protected $fillable = [
        'project_id',
        'persona_id',
        'title',
        'primary_actor',
        'description',
        'steps',
        'success_metrics',
        'priority',
    ];

    protected $casts = [
        'success_metrics' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class);
    }
}
