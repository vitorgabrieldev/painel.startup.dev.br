<?php

namespace App\Support;

class ProjectPermissions
{
    public const ACTION_VIEW = 'view';
    public const ACTION_CREATE = 'create';
    public const ACTION_EDIT = 'edit';
    public const ACTION_DELETE = 'delete';
    public const ACTION_MANAGE = 'manage';

    /**
     * Permission matrix: role => module => allowed actions.
     */
    private const MATRIX = [
        'owner' => '__all__',
        'administrator' => [
            'project' => ['view', 'create', 'edit', 'delete'],
            'stack' => ['view', 'create', 'edit', 'delete'],
            'patterns' => ['view', 'create', 'edit', 'delete'],
            'integrations' => ['view', 'create', 'edit', 'delete'],
            'nfrs' => ['view', 'create', 'edit', 'delete'],
            'decisions' => ['view', 'create', 'edit', 'delete'],
            'risks' => ['view', 'create', 'edit', 'delete'],
            'governance' => ['view', 'create', 'edit', 'delete'],
            'invites' => ['view', 'create'],
            'members' => ['view'],
        ],
        'maintainer' => [
            'project' => ['view', 'edit'],
            'stack' => ['view', 'create', 'edit'],
            'patterns' => ['view', 'create', 'edit'],
            'integrations' => ['view', 'create', 'edit'],
            'nfrs' => ['view', 'create', 'edit'],
            'decisions' => ['view', 'create', 'edit'],
            'risks' => ['view', 'create', 'edit'],
            'governance' => ['view', 'create', 'edit'],
            'invites' => ['view', 'create'],
            'members' => ['view'],
        ],
        'user' => [
            'project' => ['view'],
            'stack' => ['view'],
            'patterns' => ['view'],
            'integrations' => ['view'],
            'nfrs' => ['view'],
            'decisions' => ['view'],
            'risks' => ['view'],
            'governance' => ['view'],
            'invites' => [],
            'members' => ['view'],
        ],
    ];

    public static function allows(string $role, string $module, string $action): bool
    {
        $role = strtolower($role);
        if ($role === 'owner') {
            return true;
        }

        $matrix = self::MATRIX[$role] ?? [];
        if ($matrix === '__all__') {
            return true;
        }

        $actions = $matrix[$module] ?? [];
        return in_array($action, $actions, true);
    }

    public static function abilitiesForRole(string $role): array
    {
        $role = strtolower($role);
        if ($role === 'owner') {
            return ['*' => ['*']];
        }

        $matrix = self::MATRIX[$role] ?? [];
        if ($matrix === '__all__') {
            return ['*' => ['*']];
        }

        return $matrix;
    }

    public static function availableRoles(): array
    {
        return ['owner', 'administrator', 'maintainer', 'user'];
    }
}
