<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\SavedProperty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Saved / bookmarked properties for registered tenants only.
 * Guests receive a 403 with a prompt to register.
 */
class SavedPropertyController extends Controller
{
    /**
     * List all properties saved by the authenticated tenant.
     * GET /tenant/saved-properties
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user || !$user->isTenant()) {
                return $this->tenantOnly();
            }

            $saved = SavedProperty::where('user_id', $user->id)
                ->with(['property.agent'])
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (SavedProperty $s) => $s->property);

            return response()->json([
                'success' => true,
                'data'    => $saved,
                'total'   => $saved->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('SavedPropertyController@index: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch saved properties.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Toggle save on/off for a property.
     * POST /tenant/saved-properties/{propertyId}/toggle
     */
    public function toggle(Request $request, int $propertyId): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success'  => false,
                    'message'  => 'Please register or log in to save properties.',
                    'redirect' => 'register',
                ], 401);
            }

            if (!$user->isTenant()) {
                return $this->tenantOnly();
            }

            $property = Property::findOrFail($propertyId);

            $existing = SavedProperty::where('user_id', $user->id)
                ->where('property_id', $property->id)
                ->first();

            if ($existing) {
                $existing->delete();
                $saved = false;
            } else {
                SavedProperty::create([
                    'user_id'     => $user->id,
                    'property_id' => $property->id,
                ]);
                $saved = true;
            }

            return response()->json([
                'success' => true,
                'saved'   => $saved,
                'message' => $saved ? 'Property saved.' : 'Property removed from saved list.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Property not found.'], 404);
        } catch (\Exception $e) {
            Log::error('SavedPropertyController@toggle: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle saved property.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Check if a specific property is saved by the tenant.
     * GET /tenant/saved-properties/{propertyId}
     */
    public function check(Request $request, int $propertyId): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user || !$user->isTenant()) {
                return response()->json(['success' => true, 'saved' => false]);
            }

            $saved = SavedProperty::where('user_id', $user->id)
                ->where('property_id', $propertyId)
                ->exists();

            return response()->json(['success' => true, 'saved' => $saved]);

        } catch (\Exception $e) {
            Log::error('SavedPropertyController@check: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to check saved status.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function tenantOnly(): JsonResponse
    {
        return response()->json([
            'success'  => false,
            'message'  => 'Only registered tenants can save properties. Please register for a free tenant account.',
            'redirect' => 'register',
        ], 403);
    }
}

