<?php
namespace Core;

class Controller
{
    protected function success(mixed $data = null, string $message = 'Success', int $status = 200, array $meta = []): Response
    {
        return Response::success($data, $message, $status, $meta);
    }

    protected function error(string $message, int $status = 400, array $errors = []): Response
    {
        return Response::error($message, $status, $errors);
    }

    protected function notFound(string $message = 'Resource not found'): Response
    {
        return Response::error($message, 404);
    }

    protected function unauthorized(string $message = 'Unauthorized'): Response
    {
        return Response::error($message, 401);
    }

    protected function forbidden(string $message = 'Forbidden - insufficient permissions'): Response
    {
        return Response::error($message, 403);
    }

    protected function validate(Request $request, array $rules): ?array
    {
        $validator = new Validator($request->all(), $rules);
        if (!$validator->validate()) {
            return $validator->errors();
        }
        return null;
    }
}
