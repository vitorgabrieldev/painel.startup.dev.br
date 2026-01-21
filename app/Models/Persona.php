<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Persona extends Model
{
    protected $fillable = [
        'project_id',
        'name',
        'role',
        'goals',
        'pain_points',
        'seniority',
        'traits',
    ];

    protected $casts = [
        'traits' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function useCases(): HasMany
    {
        return $this->hasMany(UseCase::class);
    }
}
