<?php
namespace Core;

class Auth
{
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }

    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    public static function generateToken(int $userId, string $name = 'api_token'): string
    {
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

        Database::insert('user_tokens', [
            'user_id'    => $userId,
            'token'      => hash('sha256', $token),
            'name'       => $name,
            'expires_at' => $expiresAt,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        return $token;
    }

    public static function validateToken(string $rawToken): ?array
    {
        $hashedToken = hash('sha256', $rawToken);

        $sql = "SELECT u.id, u.username, u.email, u.full_name, u.role_id, u.is_active, r.name as role_name, r.slug as role_slug
                FROM user_tokens ut
                JOIN users u ON u.id = ut.user_id
                JOIN roles r ON r.id = u.role_id
                WHERE ut.token = :token AND (ut.expires_at IS NULL OR ut.expires_at > NOW()) AND u.is_active = 1
                LIMIT 1";

        $user = Database::fetch($sql, ['token' => $hashedToken]);

        if ($user) {
            // Fetch permissions for this role
            $permSql = "SELECT p.slug FROM role_permissions rp
                        JOIN permissions p ON p.id = rp.permission_id
                        WHERE rp.role_id = :role_id";
            $perms = Database::fetchAll($permSql, ['role_id' => $user['role_id']]);
            $user['permissions'] = array_column($perms, 'slug');

            // Update last used at
            Database::update('user_tokens', ['last_used_at' => date('Y-m-d H:i:s')], 'token = :token', ['token' => $hashedToken]);

            return $user;
        }

        return null;
    }

    public static function revokeToken(string $rawToken): bool
    {
        $hashedToken = hash('sha256', $rawToken);
        return Database::delete('user_tokens', 'token = :token', ['token' => $hashedToken]) > 0;
    }
}
