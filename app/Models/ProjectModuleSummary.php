<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectModuleSummary extends Model
{
    protected $fillable = [
        'project_id',
        'module',
        'summary',
        'generated_at',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
