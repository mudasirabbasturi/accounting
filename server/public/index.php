<?php
/**
 * Accounting & Inventory API Server
 * Entry Point
 */

$rootDir = dirname(__DIR__);

// Load DotEnv
require_once $rootDir . '/core/DotEnv.php';
(new Core\DotEnv($rootDir . '/.env'))->load();

// Load App Kernel
require_once $rootDir . '/core/App.php';
$app = new Core\App($rootDir);

// Load API Routes
require_once $rootDir . '/routes/api.php';

// Dispatch Request
$app->run();
