<?php
namespace App\Middleware;

use Core\Request;
use Core\Response;

class RbacMiddleware
{
    private array $requiredPermissions;

    public function __construct(string ...$permissions)
    {
        $this->requiredPermissions = $permissions;
    }

    public function handle(Request $request): ?Response
    {
        if (empty($request->user)) {
            return Response::error('Unauthorized', 401);
        }

        // Admin has full access
        if (($request->user['role_slug'] ?? '') === 'admin') {
            return null;
        }

        $userPerms = $request->user['permissions'] ?? [];

        foreach ($this->requiredPermissions as $perm) {
            if (!in_array($perm, $userPerms)) {
                return Response::error("Forbidden: Permission '{$perm}' required", 403);
            }
        }

        return null;
    }
}
