<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TechStackItem extends Model
{
    protected $fillable = [
        'project_id',
        'category',
        'name',
        'version',
        'rationale',
        'status',
        'vendor_url',
        'constraints',
    ];

    protected $casts = [
        'constraints' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
