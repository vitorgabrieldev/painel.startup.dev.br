<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Project extends Model
{
    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'purpose',
        'scope',
        'overview',
        'target_users',
        'constraints',
        'status',
        'repository_url',
        'opinionation_level',
        'ai_advisory_enabled',
        'ai_consistency_checks_enabled',
        'tags',
        'nfr_summary',
    ];

    protected $casts = [
        'ai_advisory_enabled' => 'boolean',
        'ai_consistency_checks_enabled' => 'boolean',
        'tags' => 'array',
        'nfr_summary' => 'array',
    ];

    public function personas(): HasMany
    {
        return $this->hasMany(Persona::class);
    }

    public function useCases(): HasMany
    {
        return $this->hasMany(UseCase::class);
    }

    public function techStackItems(): HasMany
    {
        return $this->hasMany(TechStackItem::class);
    }

    public function architecturePatterns(): HasMany
    {
        return $this->hasMany(ArchitecturePattern::class);
    }

    public function decisionRecords(): HasMany
    {
        return $this->hasMany(DecisionRecord::class);
    }

    public function nonFunctionalRequirements(): HasMany
    {
        return $this->hasMany(NonFunctionalRequirement::class);
    }

    public function consistencyChecks(): HasMany
    {
        return $this->hasMany(ConsistencyCheck::class);
    }

    public function risks(): HasMany
    {
        return $this->hasMany(Risk::class);
    }

    public function folderConventions(): HasMany
    {
        return $this->hasMany(FolderConvention::class);
    }

    public function integrationLinks(): HasMany
    {
        return $this->hasMany(IntegrationLink::class);
    }

    public function playbooks(): HasMany
    {
        return $this->hasMany(Playbook::class);
    }

    public function changeImpacts(): HasMany
    {
        return $this->hasMany(ChangeImpact::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function chats(): HasMany
    {
        return $this->hasMany(Chat::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function governanceRules(): HasMany
    {
        return $this->hasMany(GovernanceRule::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (!$project->uuid) {
                $project->uuid = (string) Str::uuid();
            }
        });
    }
}
