<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfileView;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ProfileViewController extends Controller
{
    /**
     * Record a view on an agent or broker profile.
     *
     * Rules:
     *  - One unique view per user / guest-session / IP per calendar day.
     *  - The profile owner viewing their own page is silently ignored.
     */
    #[OA\Post(
        path: '/agents/{user}/views',
        summary: 'Record an agent/broker profile view',
        tags: ['Analytics'],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'View recorded (or already counted today)'),
            new OA\Response(response: 404, description: 'Agent/broker not found'),
        ]
    )]
    public function record(Request $request, int $user): JsonResponse
    {
        $profile = User::where('id', $user)
            ->whereIn('role', ['agent', 'broker'])
            ->firstOrFail();

        $viewer       = $request->user();
        $guestSession = $request->attributes->get('guestSession');
        $ip           = $request->ip();

        // Do not count the owner's own views
        if ($viewer && $viewer->id === $profile->id) {
            return response()->json([
                'success' => true,
                'message' => 'Owner view not counted.',
                'data'    => ['views_count' => $profile->views_count],
            ]);
        }

        // Morph map key is 'user'
        $morphType = 'user';

        $alreadyViewed = ProfileView::alreadyViewed(
            $morphType,
            $profile->id,
            $viewer?->id,
            $guestSession?->id,
            $ip,
        );

        if (!$alreadyViewed) {
            ProfileView::create([
                'viewable_type'    => $morphType,
                'viewable_id'      => $profile->id,
                'user_id'          => $viewer?->id,
                'guest_session_id' => $guestSession?->id,
                'ip_address'       => $ip,
                'user_agent'       => $request->userAgent(),
                'viewed_at'        => now(),
            ]);

            $profile->refresh();
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'views_count'    => $profile->views_count,
                'already_viewed' => $alreadyViewed,
            ],
        ]);
    }

    /**
     * Return the cached view count for an agent/broker profile.
     */
    #[OA\Get(
        path: '/agents/{user}/views',
        summary: 'Get agent/broker profile view count',
        tags: ['Analytics'],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'View count retrieved'),
            new OA\Response(response: 404, description: 'Agent/broker not found'),
        ]
    )]
    public function count(Request $request, int $user): JsonResponse
    {
        $profile = User::where('id', $user)
            ->whereIn('role', ['agent', 'broker'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => ['views_count' => $profile->views_count],
        ]);
    }
}

