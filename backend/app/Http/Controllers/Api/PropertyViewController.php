<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class PropertyViewController extends Controller
{
    /**
     * Record a view for the given property.
     *
     * Rules:
     *  - One unique view per user / guest-session / IP per calendar day.
     *  - The property owner's own views are silently ignored.
     */
    #[OA\Post(
        path: '/properties/{property}/views',
        summary: 'Record a property view',
        tags: ['Analytics'],
        parameters: [
            new OA\Parameter(name: 'property', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'View recorded (or already counted today)'),
            new OA\Response(response: 404, description: 'Property not found'),
        ]
    )]
    public function record(Request $request, int $property): JsonResponse
    {
        $prop = Property::findOrFail($property);

        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');
        $ip           = $request->ip();

        // Do not count the owner's own views
        if ($user && $prop->agent_id === $user->id) {
            return response()->json([
                'success'     => true,
                'message'     => 'Owner view not counted.',
                'data'        => ['views_count' => $prop->views_count],
            ]);
        }

        $alreadyViewed = PropertyView::alreadyViewed(
            $prop->id,
            $user?->id,
            $guestSession?->id,
            $ip,
        );

        if (!$alreadyViewed) {
            PropertyView::create([
                'property_id'      => $prop->id,
                'user_id'          => $user?->id,
                'guest_session_id' => $guestSession?->id,
                'ip_address'       => $ip,
                'user_agent'       => $request->userAgent(),
                'viewed_at'        => now(),
            ]);

            // Refresh to get the incremented count from the observer
            $prop->refresh();
        }

        return response()->json([
            'success'        => true,
            'data'           => [
                'views_count'   => $prop->views_count,
                'already_viewed' => $alreadyViewed,
            ],
        ]);
    }

    /**
     * Return the cached view count for a property.
     */
    #[OA\Get(
        path: '/properties/{property}/views',
        summary: 'Get property view count',
        tags: ['Analytics'],
        parameters: [
            new OA\Parameter(name: 'property', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'View count retrieved'),
            new OA\Response(response: 404, description: 'Property not found'),
        ]
    )]
    public function count(Request $request, int $property): JsonResponse
    {
        $prop = Property::findOrFail($property);

        return response()->json([
            'success' => true,
            'data'    => ['views_count' => $prop->views_count],
        ]);
    }
}

