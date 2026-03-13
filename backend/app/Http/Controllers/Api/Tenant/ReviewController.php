<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\GuestSession;
use App\Models\Property;
use App\Models\Review;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Reviews for properties and agents/brokers.
 *
 * Public (read) endpoints: anyone can view approved reviews.
 * Write endpoints: registered tenants or guests with a valid session.
 * Admin moderation: admin/super_admin/moderator can approve/reject.
 */
class ReviewController extends Controller
{
    // =========================================================================
    // Public — list approved reviews
    // =========================================================================

    /**
     * Get approved reviews for a property.
     * GET /properties/{id}/reviews
     */
    public function forProperty(Request $request, int $propertyId): JsonResponse
    {
        try {
            $property = Property::findOrFail($propertyId);

            $reviews = Review::where('reviewable_type', Property::class)
                ->where('reviewable_id', $property->id)
                ->where('status', 'approved')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (Review $r) => $this->format($r));

            $avg = $reviews->avg('rating');

            return response()->json([
                'success'        => true,
                'data'           => $reviews,
                'average_rating' => $avg ? round($avg, 1) : null,
                'total'          => $reviews->count(),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Property not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ReviewController@forProperty: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reviews.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get approved reviews for an agent/broker.
     * GET /agents/{id}/reviews
     */
    public function forAgent(Request $request, int $agentId): JsonResponse
    {
        try {
            $agent = User::findOrFail($agentId);

            $reviews = Review::where('reviewable_type', User::class)
                ->where('reviewable_id', $agent->id)
                ->where('status', 'approved')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (Review $r) => $this->format($r));

            $avg = $reviews->avg('rating');

            return response()->json([
                'success'        => true,
                'data'           => $reviews,
                'average_rating' => $avg ? round($avg, 1) : null,
                'total'          => $reviews->count(),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Agent not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ReviewController@forAgent: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch reviews.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // =========================================================================
    // Write — submit a review
    // =========================================================================

    /**
     * Submit a review for a property.
     * POST /properties/{id}/reviews
     *
     * Auth: registered tenant (auth:sanctum) OR guest (guest.session middleware).
     * Guests' reviews are held as 'pending' until approved.
     * Registered tenants' reviews are auto-approved.
     */
    public function submitForProperty(Request $request, int $propertyId): JsonResponse
    {
        return $this->submitReview($request, Property::class, $propertyId);
    }

    /**
     * Submit a review for an agent/broker.
     * POST /agents/{id}/reviews
     *
     * Only registered tenants can review agents (they must have dealt with them).
     */
    public function submitForAgent(Request $request, int $agentId): JsonResponse
    {
        // Only registered tenants can review agents
        $user = $request->user();
        if (!$user || !$user->isTenant()) {
            return response()->json([
                'success' => false,
                'message' => 'Only registered tenants can review agents.',
            ], 403);
        }

        return $this->submitReview($request, User::class, $agentId, forceUser: true);
    }

    // =========================================================================
    // Admin moderation
    // =========================================================================

    /**
     * List all pending reviews (admin only).
     * GET /admin/reviews/pending
     */
    public function pendingReviews(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || !$user->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $reviews = Review::where('status', 'pending')
                ->orderBy('created_at')
                ->get()
                ->map(fn (Review $r) => $this->formatAdmin($r));

            return response()->json(['success' => true, 'data' => $reviews]);

        } catch (\Exception $e) {
            Log::error('ReviewController@pendingReviews: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending reviews.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Approve or reject a review.
     * PUT /admin/reviews/{id}/moderate
     * Body: { action: 'approve' | 'reject' }
     */
    public function moderate(Request $request, int $reviewId): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user || !$user->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'action' => 'required|in:approve,reject',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $review = Review::findOrFail($reviewId);

            $newStatus = $request->action === 'approve' ? 'approved' : 'rejected';
            $review->update(['status' => $newStatus]);

            // Notify reviewed party when a review is approved
            if ($newStatus === 'approved') {
                $this->notifyReviewedParty($review);
            }

            return response()->json([
                'success' => true,
                'message' => 'Review ' . $newStatus . ' successfully.',
                'data'    => $this->formatAdmin($review->fresh()),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Review not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ReviewController@moderate: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to moderate review.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private function submitReview(
        Request $request,
        string $reviewableType,
        int $reviewableId,
        bool $forceUser = false
    ): JsonResponse {
        try {
            $user  = $request->user();
            $guest = $request->attributes->get('guest_session');

            if (!$user && !$guest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required. Please log in or provide a guest token.',
                ], 401);
            }

            if ($forceUser && !$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be a registered tenant to perform this action.',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'rating'  => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            // Verify the reviewed entity exists
            $reviewableClass = $reviewableType;
            $entity = $reviewableClass::find($reviewableId);

            if (!$entity) {
                return response()->json([
                    'success' => false,
                    'message' => 'The reviewed item was not found.',
                ], 404);
            }

            // Determine reviewer info
            $reviewerType  = $user ? 'user' : 'guest_session';
            $reviewerId    = $user ? $user->id : $guest->id;
            $reviewerName  = $user ? $user->full_name : $guest->name;
            $reviewerEmail = $user ? $user->email : $guest->email;

            // Prevent duplicate reviews
            $existing = Review::where('reviewable_type', $reviewableType)
                ->where('reviewable_id', $reviewableId)
                ->where('reviewer_type', $reviewerType)
                ->where('reviewer_id', $reviewerId)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already submitted a review for this item.',
                ], 409);
            }

            // Registered tenants' reviews are auto-approved; guests are pending
            $status = ($user && $user->isTenant()) ? 'approved' : 'pending';

            $review = Review::create([
                'reviewable_type' => $reviewableType,
                'reviewable_id'   => $reviewableId,
                'reviewer_type'   => $reviewerType,
                'reviewer_id'     => $reviewerId,
                'reviewer_name'   => $reviewerName,
                'reviewer_email'  => $reviewerEmail,
                'rating'          => $request->rating,
                'comment'         => $request->comment,
                'status'          => $status,
            ]);

            // Notify the reviewed party when auto-approved
            if ($status === 'approved') {
                $this->notifyReviewedParty($review);
            }

            return response()->json([
                'success' => true,
                'message' => $status === 'approved'
                    ? 'Review submitted successfully.'
                    : 'Review submitted and is pending moderation.',
                'data'    => $this->format($review),
            ], 201);

        } catch (\Exception $e) {
            Log::error('ReviewController@submitReview: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit review.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /** Notify the owner of the reviewed entity about a new approved review. */
    private function notifyReviewedParty(Review $review): void
    {
        $ownerId = null;

        if ($review->reviewable_type === Property::class) {
            $property = Property::find($review->reviewable_id);
            $ownerId  = $property?->agent_id;
        } elseif ($review->reviewable_type === User::class) {
            $ownerId = $review->reviewable_id;
        }

        if ($ownerId) {
            UserNotification::notify(
                $ownerId,
                'new_review',
                'You received a new review',
                ($review->reviewer_name ?? 'Someone') . ' gave you ' . $review->rating . ' star(s).',
                ['review_id' => $review->id, 'reviewable_type' => $review->reviewable_type, 'reviewable_id' => $review->reviewable_id]
            );
        }
    }

    /** Format a review for public API response. */
    private function format(Review $review): array
    {
        return [
            'id'           => $review->id,
            'reviewer_name' => $review->reviewer_display_name,
            'rating'       => $review->rating,
            'comment'      => $review->comment,
            'created_at'   => $review->created_at,
        ];
    }

    /** Format a review for admin API response (includes all fields). */
    private function formatAdmin(Review $review): array
    {
        return [
            'id'              => $review->id,
            'reviewable_type' => $review->reviewable_type,
            'reviewable_id'   => $review->reviewable_id,
            'reviewer_type'   => $review->reviewer_type,
            'reviewer_id'     => $review->reviewer_id,
            'reviewer_name'   => $review->reviewer_name,
            'reviewer_email'  => $review->reviewer_email,
            'rating'          => $review->rating,
            'comment'         => $review->comment,
            'status'          => $review->status,
            'created_at'      => $review->created_at,
        ];
    }
}

