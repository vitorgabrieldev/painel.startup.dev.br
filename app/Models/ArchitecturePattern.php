<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchitecturePattern extends Model
{
    protected $fillable = [
        'project_id',
        'name',
        'rationale',
        'constraints',
        'status',
        'references',
    ];

    protected $casts = [
        'constraints' => 'array',
        'references' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
