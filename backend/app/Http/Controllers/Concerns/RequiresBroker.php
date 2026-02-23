<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

trait RequiresBroker
{
    /**
     * Ensure the authenticated user is a Broker.
     *
     * @param Request $request
     * @return User
     * @throws \Illuminate\Http\Exceptions\HttpResponseException
     */
    protected function ensureBroker(Request $request): User
    {
        $user = $request->user();
        
        if (!$user || !$user->isBroker()) {
            abort(403, 'Access denied. Broker authentication required.');
        }

        return $user;
    }
}

