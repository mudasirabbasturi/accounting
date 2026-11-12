<?php
namespace Core;

class Router
{
    private array $routes = [];
    private string $groupPrefix = '';
    private array $groupMiddlewares = [];

    public function get(string $uri, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('GET', $uri, $handler, $middlewares);
    }

    public function post(string $uri, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('POST', $uri, $handler, $middlewares);
    }

    public function put(string $uri, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('PUT', $uri, $handler, $middlewares);
    }

    public function patch(string $uri, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('PATCH', $uri, $handler, $middlewares);
    }

    public function delete(string $uri, mixed $handler, array $middlewares = []): self
    {
        return $this->addRoute('DELETE', $uri, $handler, $middlewares);
    }

    public function options(string $uri, mixed $handler): self
    {
        return $this->addRoute('OPTIONS', $uri, $handler);
    }

    public function group(string $prefix, callable $callback, array $middlewares = []): void
    {
        $previousPrefix = $this->groupPrefix;
        $previousMiddlewares = $this->groupMiddlewares;

        $this->groupPrefix = rtrim($this->groupPrefix . '/' . trim($prefix, '/'), '/');
        $this->groupMiddlewares = array_merge($this->groupMiddlewares, $middlewares);

        $callback($this);

        $this->groupPrefix = $previousPrefix;
        $this->groupMiddlewares = $previousMiddlewares;
    }

    private function addRoute(string $method, string $uri, mixed $handler, array $middlewares = []): self
    {
        $fullUri = $this->groupPrefix . '/' . trim($uri, '/');
        $fullUri = '/' . trim($fullUri, '/');
        if ($fullUri === '') $fullUri = '/';

        // Convert {param} to regex pattern
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $fullUri);
        $pattern = '#^' . $pattern . '$#';

        $allMiddlewares = array_merge($this->groupMiddlewares, $middlewares);

        $this->routes[] = [
            'method'      => strtoupper($method),
            'pattern'     => $pattern,
            'handler'     => $handler,
            'uri'         => $fullUri,
            'middlewares' => $allMiddlewares,
        ];

        return $this;
    }

    public function dispatch(Request $request): Response
    {
        $method = $request->method();
        $uri = strtok($request->uri(), '?');
        $uri = '/' . trim($uri, '/');
        if ($uri === '') $uri = '/';

        // Automatic CORS pre-flight OPTIONS handler
        if ($method === 'OPTIONS') {
            return new Response('', 200, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept',
            ]);
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $uri, $matches)) {
                $params = array_filter($matches, fn($key) => is_string($key), ARRAY_FILTER_USE_KEY);
                $request->setParams($params);

                // Run middlewares
                foreach ($route['middlewares'] as $mw) {
                    $mwInstance = is_string($mw) ? new $mw() : $mw;
                    $result = $mwInstance->handle($request);
                    if ($result instanceof Response) {
                        return $result;
                    }
                }

                // Execute handler
                return $this->executeHandler($route['handler'], $request, $params);
            }
        }

        return Response::error("API endpoint not found: {$method} {$uri}", 404);
    }

    private function executeHandler(mixed $handler, Request $request, array $params): Response
    {
        if ($handler instanceof \Closure) {
            $result = call_user_func_array($handler, array_merge([$request], array_values($params)));
            return $this->wrapResponse($result);
        }

        if (is_string($handler) && str_contains($handler, '@')) {
            list($controller, $method) = explode('@', $handler);
            $class = "\\App\\Controllers\\{$controller}";
            if (!class_exists($class)) {
                throw new \Exception("Controller class {$class} not found");
            }
            $instance = new $class();
            if (!method_exists($instance, $method)) {
                throw new \Exception("Method {$method} not found in {$class}");
            }
            $result = call_user_func_array([$instance, $method], array_merge([$request], array_values($params)));
            return $this->wrapResponse($result);
        }

        if (is_array($handler) && count($handler) === 2) {
            $instance = is_string($handler[0]) ? new $handler[0]() : $handler[0];
            $method = $handler[1];
            $result = call_user_func_array([$instance, $method], array_merge([$request], array_values($params)));
            return $this->wrapResponse($result);
        }

        throw new \Exception('Invalid route handler configuration');
    }

    private function wrapResponse(mixed $result): Response
    {
        if ($result instanceof Response) {
            return $result;
        }
        if (is_array($result) || is_object($result)) {
            $res = new Response();
            return $res->json($result);
        }
        $res = new Response();
        return $res->json(['message' => (string)$result]);
    }

    public function getRoutes(): array
    {
        return $this->routes;
    }
}
