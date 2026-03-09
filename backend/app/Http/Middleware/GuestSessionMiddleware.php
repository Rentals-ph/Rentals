<?php

namespace App\Http\Middleware;

use App\Models\GuestSession;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Identifies a guest user by their browser token (sent as the
 * X-Guest-Token header or a guest_token query parameter / cookie).
 *
 * If a valid, active GuestSession is found it is attached to the
 * request as $request->guestSession so controllers can use it.
 *
 * Usage in routes:
 *   Route::middleware('guest.session')->...
 *
 * Middleware alias registered in Kernel.php: 'guest.session'
 */
class GuestSessionMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('X-Guest-Token')
            ?? $request->cookie('guest_token')
            ?? $request->query('guest_token');

        if ($token) {
            $session = GuestSession::findByToken($token);

            if ($session) {
                $session->touchActivity();
                $request->merge(['_guest_session' => $session]);
                // Also expose via a typed accessor (see macro below)
                $request->attributes->set('guest_session', $session);
            }
        }

        return $next($request);
    }
}

