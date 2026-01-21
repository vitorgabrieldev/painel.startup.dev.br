<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Risk extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'severity',
        'likelihood',
        'impact_area',
        'description',
        'mitigation',
        'owner',
        'status',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
