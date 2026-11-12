<?php
/**
 * Router script for PHP Built-in Web Server
 * Usage: php -S localhost:8000 router.php
 * Or:    php -S localhost:8000 -t public
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If the file exists in public/ directory, serve it directly
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

// Forward all other requests to public/index.php
require_once __DIR__ . '/public/index.php';
