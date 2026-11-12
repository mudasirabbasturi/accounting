<?php
namespace App\Controllers;

use Core\Controller;
use Core\Request;
use Core\Response;
use Core\Database;
use Core\Auth;

class AuthController extends Controller
{
    public function login(Request $request): Response
    {
        $username = trim($request->input('username', ''));
        $password = $request->input('password', '');

        if (empty($username) || empty($password)) {
            return $this->error('Username and password are required', 422);
        }

        $user = Database::fetch(
            "SELECT u.*, r.name as role_name, r.slug as role_slug
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE (u.username = :uname OR u.email = :uemail) AND u.is_active = 1
             LIMIT 1",
            ['uname' => $username, 'uemail' => $username]
        );

        if (!$user || !Auth::verifyPassword($password, $user['password_hash'])) {
            return $this->error('Invalid credentials or account disabled', 401);
        }

        $token = Auth::generateToken($user['id']);

        // Fetch user permissions
        $perms = Database::fetchAll(
            "SELECT p.slug FROM role_permissions rp
             JOIN permissions p ON p.id = rp.permission_id
             WHERE rp.role_id = :role_id",
            ['role_id' => $user['role_id']]
        );

        unset($user['password_hash']);
        $user['permissions'] = array_column($perms, 'slug');

        return $this->success([
            'token' => $token,
            'user'  => $user,
        ], 'Login successful');
    }

    public function profile(Request $request): Response
    {
        return $this->success($request->user);
    }

    public function logout(Request $request): Response
    {
        $token = $request->bearerToken();
        if ($token) {
            Auth::revokeToken($token);
        }
        return $this->success(null, 'Logged out successfully');
    }

    public function users(Request $request): Response
    {
        $users = Database::fetchAll(
            "SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                    r.id as role_id, r.name as role_name, r.slug as role_slug
             FROM users u
             JOIN roles r ON r.id = u.role_id
             ORDER BY u.id ASC"
        );
        return $this->success($users);
    }

    public function roles(Request $request): Response
    {
        $roles = Database::fetchAll("SELECT * FROM roles ORDER BY id ASC");
        return $this->success($roles);
    }
}
