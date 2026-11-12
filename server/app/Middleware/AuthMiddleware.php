<?php
namespace App\Middleware;

use Core\Request;
use Core\Response;
use Core\Auth;

class AuthMiddleware
{
    public function handle(Request $request): ?Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return Response::error('Unauthorized: Missing Bearer Token', 401);
        }

        $user = Auth::validateToken($token);

        if (!$user) {
            return Response::error('Unauthorized: Invalid or expired token', 401);
        }

        $request->user = $user;
        return null;
    }
}
