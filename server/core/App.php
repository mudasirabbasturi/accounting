<?php
namespace Core;

class App
{
    private static ?App $instance = null;
    private Router $router;
    private static string $rootDir;

    public function __construct(string $rootDir)
    {
        self::$rootDir = rtrim($rootDir, '/\\');
        self::$instance = $this;

        // Register custom autoloader
        self::registerAutoloader();

        $this->router = new Router();
    }

    public static function getInstance(): ?App
    {
        return self::$instance;
    }

    public static function getRootDir(): string
    {
        return self::$rootDir;
    }

    public function getRouter(): Router
    {
        return $this->router;
    }

    public static function registerAutoloader(): void
    {
        spl_autoload_register(function ($class) {
            $prefixes = [
                'Core\\' => self::$rootDir . '/core/',
                'App\\'  => self::$rootDir . '/app/',
            ];

            foreach ($prefixes as $prefix => $baseDir) {
                $len = strlen($prefix);
                if (strncmp($prefix, $class, $len) !== 0) {
                    continue;
                }

                $relativeClass = substr($class, $len);
                $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

                if (file_exists($file)) {
                    require_once $file;
                    return;
                }
            }
        });
    }

    public function run(): void
    {
        try {
            $request = new Request();
            $response = $this->router->dispatch($request);
            $response->send();
        } catch (\Throwable $e) {
            $this->handleException($e);
        }
    }

    private function handleException(\Throwable $e): void
    {
        $isDebug = DotEnv::get('APP_DEBUG', true);

        if ($isDebug) {
            $res = Response::error($e->getMessage(), 500, [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString()),
            ]);
        } else {
            $res = Response::error('Internal Server Error', 500);
        }

        $res->send();
    }
}
