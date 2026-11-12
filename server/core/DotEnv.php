<?php
namespace Core;

class DotEnv
{
    protected string $path;

    public function __construct(string $path)
    {
        $this->path = $path;
    }

    public function load(): void
    {
        if (!file_exists($this->path)) {
            return;
        }

        $lines = file($this->path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }

            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);

                // Strip quotes if any
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }

                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
                putenv("{$name}={$value}");
            }
        }
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $val = getenv($key);
        if ($val === false) {
            $val = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
        }
        if ($val === 'true') return true;
        if ($val === 'false') return false;
        if ($val === 'null') return null;
        return $val;
    }
}
