<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontReport = [
        //
    ];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Add CORS headers to a response for API requests (so browser can read error responses).
     */
    private function addCorsToResponse(Response $response, $request): Response
    {
        $origin = $request->header('Origin');
        $allowed = array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173')));
        if ($origin && in_array($origin, $allowed)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        } else {
            $response->headers->set('Access-Control-Allow-Origin', '*');
        }
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        return $response;
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws \Throwable
     */
    public function render($request, Throwable $e)
    {
        // Handle PostTooLargeException for API requests
        if ($e instanceof PostTooLargeException && $request->expectsJson()) {
            $response = response()->json([
                'success' => false,
                'message' => 'The uploaded file is too large. Maximum file size is 10MB per image.',
                'error' => 'File size exceeds the maximum allowed limit. Please reduce the file size and try again.',
            ], 413);
            return $this->addCorsToResponse($response, $request);
        }

        // Handle ValidationException for API requests
        if ($e instanceof ValidationException && $request->expectsJson()) {
            $response = response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
            return $this->addCorsToResponse($response, $request);
        }

        $response = parent::render($request, $e);
        if ($request->is('api/*')) {
            return $this->addCorsToResponse($response, $request);
        }
        return $response;
    }
}

