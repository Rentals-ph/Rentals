<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\BlogLike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class BlogLikeController extends Controller
{
    /**
     * Toggle like / unlike on a blog post.
     *
     * Works for:
     *  - Authenticated registered users (user_id set)
     *  - Guest sessions (guest_session_id set via guest.session middleware)
     */
    #[OA\Post(
        path: '/blogs/{blog}/likes',
        summary: 'Toggle like on a blog post',
        tags: ['Blog Engagement'],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liked or unliked successfully'),
            new OA\Response(response: 403, description: 'No user or guest session found'),
            new OA\Response(response: 404, description: 'Blog not found'),
        ]
    )]
    public function toggle(Request $request, int $blog): JsonResponse
    {
        $post         = Blog::findOrFail($blog);
        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');

        if (!$user && !$guestSession) {
            return response()->json([
                'success' => false,
                'message' => 'A user account or guest session is required to like posts.',
            ], 403);
        }

        $userId         = $user?->id;
        $guestSessionId = $guestSession?->id;

        $existing = BlogLike::findForViewer($post->id, $userId, $guestSessionId);

        if ($existing) {
            $existing->delete(); // observer decrements likes_count
            $liked = false;
        } else {
            BlogLike::create([
                'blog_id'          => $post->id,
                'user_id'          => $userId,
                'guest_session_id' => $guestSessionId,
            ]); // observer increments likes_count
            $liked = true;
        }

        $post->refresh();

        return response()->json([
            'success' => true,
            'data'    => [
                'liked'       => $liked,
                'likes_count' => $post->likes_count,
            ],
        ]);
    }

    /**
     * Return the like count and whether the current viewer has liked the post.
     */
    #[OA\Get(
        path: '/blogs/{blog}/likes',
        summary: 'Get blog like count and liked status',
        tags: ['Blog Engagement'],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Like info retrieved'),
            new OA\Response(response: 404, description: 'Blog not found'),
        ]
    )]
    public function show(Request $request, int $blog): JsonResponse
    {
        $post         = Blog::findOrFail($blog);
        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');

        $liked = BlogLike::findForViewer(
            $post->id,
            $user?->id,
            $guestSession?->id,
        ) !== null;

        return response()->json([
            'success' => true,
            'data'    => [
                'liked'       => $liked,
                'likes_count' => $post->likes_count,
            ],
        ]);
    }
}

