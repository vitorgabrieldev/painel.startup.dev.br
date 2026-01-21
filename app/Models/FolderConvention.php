<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FolderConvention extends Model
{
    protected $fillable = [
        'project_id',
        'name',
        'path',
        'description',
        'rules',
    ];

    protected $casts = [
        'rules' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
