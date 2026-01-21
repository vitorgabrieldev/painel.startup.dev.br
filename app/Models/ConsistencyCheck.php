<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsistencyCheck extends Model
{
    protected $fillable = [
        'project_id',
        'area',
        'status',
        'message',
        'details',
        'source',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
