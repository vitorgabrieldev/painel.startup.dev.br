<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChangeImpact extends Model
{
    protected $fillable = [
        'project_id',
        'decision_record_id',
        'summary',
        'impact_area',
        'risk_level',
        'details',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function decisionRecord(): BelongsTo
    {
        return $this->belongsTo(DecisionRecord::class);
    }
}
