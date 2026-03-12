<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogComment;
use App\Models\BlogCommentLike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use OpenApi\Attributes as OA;

class BlogCommentLikeController extends Controller
{
    /**
     * Toggle like / unlike on a blog comment.
     */
    #[OA\Post(
        path: '/blogs/{blog}/comments/{comment}/likes',
        summary: 'Toggle like on a blog comment',
        tags: ['Blog Engagement'],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'comment', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liked or unliked successfully'),
            new OA\Response(response: 403, description: 'No user or guest session found'),
            new OA\Response(response: 404, description: 'Comment not found'),
        ]
    )]
    public function toggle(Request $request, int $blog, int $comment): JsonResponse
    {
        $commentModel = BlogComment::where('id', $comment)
            ->where('blog_id', $blog)
            ->firstOrFail();

        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');

        if (!$user && !$guestSession) {
            return response()->json([
                'success' => false,
                'message' => 'A user account or guest session is required to like comments.',
            ], 403);
        }

        $userId         = $user?->id;
        $guestSessionId = $guestSession?->id;

        // Create a unique cache key for this user/guest and comment combination
        $cacheKey = $userId 
            ? "comment_like_action:comment_{$comment}:user_{$userId}"
            : "comment_like_action:comment_{$comment}:guest_{$guestSessionId}";

        // Check if there was a recent action (within last 3 seconds) to prevent spam
        $recentAction = Cache::get($cacheKey);
        if ($recentAction && (now()->timestamp - $recentAction) < 3) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait a moment before liking/unliking again.',
            ], 429);
        }

        $existing = BlogCommentLike::findForViewer($commentModel->id, $userId, $guestSessionId);

        if ($existing) {
            // Check if this like was just created (prevent rapid toggle spam)
            // Prevent unliking if the like was created less than 2 seconds ago
            $secondsSinceCreated = $existing->created_at->diffInSeconds(now());
            if ($secondsSinceCreated < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please wait a moment before unliking.',
                ], 429);
            }
            
            // Store action timestamp in cache (expires in 10 seconds)
            Cache::put($cacheKey, now()->timestamp, 10);
            
            $existing->delete();
            $liked = false;
        } else {
            // Store action timestamp in cache (expires in 10 seconds)
            Cache::put($cacheKey, now()->timestamp, 10);
            
            BlogCommentLike::create([
                'comment_id'       => $commentModel->id,
                'user_id'          => $userId,
                'guest_session_id' => $guestSessionId,
            ]);
            $liked = true;
        }

        // Refresh to get updated likes count
        $commentModel->refresh();
        $likesCount = BlogCommentLike::where('comment_id', $commentModel->id)->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'liked'       => $liked,
                'likes_count' => $likesCount,
            ],
        ]);
    }

    /**
     * Get like count and whether the current viewer has liked the comment.
     */
    #[OA\Get(
        path: '/blogs/{blog}/comments/{comment}/likes',
        summary: 'Get comment like count and liked status',
        tags: ['Blog Engagement'],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'comment', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Like info retrieved'),
            new OA\Response(response: 404, description: 'Comment not found'),
        ]
    )]
    public function show(Request $request, int $blog, int $comment): JsonResponse
    {
        $commentModel = BlogComment::where('id', $comment)
            ->where('blog_id', $blog)
            ->firstOrFail();

        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');

        $liked = BlogCommentLike::findForViewer(
            $commentModel->id,
            $user?->id,
            $guestSession?->id,
        ) !== null;

        $likesCount = BlogCommentLike::where('comment_id', $commentModel->id)->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'liked'       => $liked,
                'likes_count' => $likesCount,
            ],
        ]);
    }
}

