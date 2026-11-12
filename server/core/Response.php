<?php
namespace Core;

class Response
{
    private mixed $content;
    private int $statusCode;
    private array $headers;

    public function __construct(mixed $content = '', int $statusCode = 200, array $headers = [])
    {
        $this->content = $content;
        $this->statusCode = $statusCode;
        $this->headers = array_merge([
            'Content-Type' => 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept',
        ], $headers);
    }

    public function json(mixed $data, int $statusCode = 200): self
    {
        $this->content = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $this->statusCode = $statusCode;
        $this->headers['Content-Type'] = 'application/json; charset=utf-8';
        return $this;
    }

    public function setStatusCode(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function setHeader(string $key, string $value): self
    {
        $this->headers[$key] = $value;
        return $this;
    }

    public function send(): void
    {
        http_response_code($this->statusCode);

        foreach ($this->headers as $key => $value) {
            header("{$key}: {$value}");
        }

        echo is_string($this->content) ? $this->content : json_encode($this->content);

        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        }
    }

    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200, array $meta = []): self
    {
        $res = new self();
        $payload = [
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ];
        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }
        return $res->json($payload, $statusCode);
    }

    public static function error(string $message, int $statusCode = 400, array $errors = []): self
    {
        $res = new self();
        $payload = [
            'success' => false,
            'message' => $message,
        ];
        if (!empty($errors)) {
            $payload['errors'] = $errors;
        }
        return $res->json($payload, $statusCode);
    }
}
