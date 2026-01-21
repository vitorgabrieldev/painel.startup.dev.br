<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NonFunctionalRequirement extends Model
{
    protected $fillable = [
        'project_id',
        'category',
        'metric',
        'target',
        'priority',
        'rationale',
        'current_assessment',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
