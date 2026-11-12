<?php
/**
 * Database Migration & Seeding CLI Script
 * Usage: php database/migrate.php
 */

$rootDir = dirname(__DIR__);

require_once $rootDir . '/core/DotEnv.php';
(new Core\DotEnv($rootDir . '/.env'))->load();

require_once $rootDir . '/core/App.php';
new Core\App($rootDir);

use Core\Database;

echo "========================================================\n";
echo "Enterprise Accounting & Inventory Database Migration\n";
echo "========================================================\n";

try {
    $pdo = Database::getConnection();
    echo "Connected to MySQL database [" . Core\DotEnv::get('DB_DATABASE') . "] successfully.\n";

    // 1. Run Schema
    $schemaPath = $rootDir . '/database/schema.sql';
    echo "Running schema DDL from {$schemaPath}...\n";
    $schemaSql = file_get_contents($schemaPath);
    $pdo->exec($schemaSql);
    echo "Schema successfully executed!\n";

    // 2. Run Seed
    $seedPath = $rootDir . '/database/seed.sql';
    echo "Running seed data from {$seedPath}...\n";
    $seedSql = file_get_contents($seedPath);
    $pdo->exec($seedSql);
    echo "Seed data successfully inserted!\n";

    // Update admin user password with bcrypt
    $adminPasswordHash = password_hash('admin123', PASSWORD_BCRYPT);
    Database::update('users', ['password_hash' => $adminPasswordHash], 'id = :id', ['id' => 1]);
    echo "Admin user ready: username='admin', password='admin123'\n";

    // Verify tables
    $tables = Database::fetchAll("SHOW TABLES");
    echo "Total tables created: " . count($tables) . "\n";
    echo "Migration completed successfully!\n";

} catch (\Throwable $e) {
    echo "MIGRATION FAILED: " . $e->getMessage() . "\n";
    echo "In " . $e->getFile() . " on line " . $e->getLine() . "\n";
    exit(1);
}
