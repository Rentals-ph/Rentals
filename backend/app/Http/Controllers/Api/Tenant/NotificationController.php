<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * In-app notifications for registered users (tenants, agents, brokers).
 * Guests do not have in-app notifications.
 */
class NotificationController extends Controller
{
    /**
     * List notifications for the authenticated user.
     * Supports filtering by read status.
     *
     * GET /notifications
     * Query: ?is_read=0|1
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $query = UserNotification::where('user_id', $user->id)
                ->orderByDesc('created_at');

            if ($request->has('is_read')) {
                $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
            }

            $notifications = $query->get();

            return response()->json([
                'success'      => true,
                'data'         => $notifications,
                'unread_count' => UserNotification::where('user_id', $user->id)
                    ->where('is_read', false)
                    ->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('NotificationController@index: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get unread notification count badge only (lightweight endpoint).
     * GET /notifications/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $count = UserNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['success' => true, 'unread_count' => $count]);
    }

    /**
     * Mark a single notification as read.
     * PUT /notifications/{id}/read
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $notification = UserNotification::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read.',
                'data'    => $notification,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        } catch (\Exception $e) {
            Log::error('NotificationController@markAsRead: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Mark all notifications as read.
     * PUT /notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $count = UserNotification::where('user_id', $user->id)
                ->where('is_read', false)
                ->update(['is_read' => true, 'read_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => $count . ' notification(s) marked as read.',
                'marked'  => $count,
            ]);

        } catch (\Exception $e) {
            Log::error('NotificationController@markAllAsRead: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Delete a notification.
     * DELETE /notifications/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $notification = UserNotification::where('id', $id)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        } catch (\Exception $e) {
            Log::error('NotificationController@destroy: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}

