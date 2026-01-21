<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DecisionRecord extends Model
{
    protected $fillable = [
        'project_id',
        'supersedes_id',
        'title',
        'status',
        'context',
        'options',
        'decision',
        'consequences',
        'references',
        'tags',
    ];

    protected $casts = [
        'options' => 'array',
        'references' => 'array',
        'tags' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function supersedes(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supersedes_id');
    }

    public function changeImpacts(): HasMany
    {
        return $this->hasMany(ChangeImpact::class);
    }
}
