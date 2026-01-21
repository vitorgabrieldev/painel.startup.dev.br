<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GovernanceRule extends Model
{
    protected $fillable = [
        'project_id',
        'name',
        'scope',
        'description',
        'requirements',
        'status',
    ];

    protected $casts = [
        'requirements' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
