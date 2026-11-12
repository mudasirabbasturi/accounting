<?php
namespace Core;

class Request
{
    private string $method;
    private string $uri;
    private array $headers;
    private array $body;
    private array $query;
    private array $files;
    private array $params = [];
    public ?array $user = null;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $this->headers = $this->parseHeaders();
        $this->query = $_GET ?? [];
        $this->body = $this->parseBody();
        $this->files = $_FILES ?? [];
    }

    public function method(): string
    {
        return $this->method;
    }

    public function uri(): string
    {
        return $this->uri;
    }

    public function all(): array
    {
        return array_merge($this->query, $this->body);
    }

    public function input(?string $key = null, mixed $default = null): mixed
    {
        $data = $this->all();
        if ($key === null) {
            return $data;
        }
        return $data[$key] ?? $default;
    }

    public function query(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->query;
        }
        return $this->query[$key] ?? $default;
    }

    public function body(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->body;
        }
        return $this->body[$key] ?? $default;
    }

    public function has(string $key): bool
    {
        return array_key_exists($key, $this->all());
    }

    public function only(array|string $keys): array
    {
        $data = $this->all();
        return array_intersect_key($data, array_flip((array) $keys));
    }

    public function header(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->headers;
        }
        $key = strtoupper(str_replace('-', '_', $key));
        return $this->headers[$key] ?? $default;
    }

    public function bearerToken(): ?string
    {
        $header = $this->header('AUTHORIZATION') ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
        if ($header && preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return trim($matches[1]);
        }
        return null;
    }

    public function setParams(array $params): void
    {
        $this->params = $params;
    }

    public function param(string $key, mixed $default = null): mixed
    {
        return $this->params[$key] ?? $default;
    }

    public function getParams(): array
    {
        return $this->params;
    }

    private function parseHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = str_replace('_', '-', substr($key, 5));
                $headers[$headerName] = $value;
                $headers[strtoupper($headerName)] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['CONTENT-TYPE'] = $_SERVER['CONTENT_TYPE'];
        }
        return $headers;
    }

    private function parseBody(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true);
            return is_array($data) ? $data : [];
        }

        if (in_array($this->method, ['POST', 'PUT', 'PATCH'])) {
            if (!empty($_POST)) {
                return $_POST;
            }
            // For PUT/PATCH with form data
            $raw = file_get_contents('php://input');
            parse_str($raw, $parsed);
            return is_array($parsed) ? $parsed : [];
        }

        return [];
    }
}
