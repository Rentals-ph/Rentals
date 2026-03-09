<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\BlogView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class BlogViewController extends Controller
{
    #[OA\Post(
        path: '/blogs/{blog}/views',
        summary: 'Record a blog post view',
        tags: ['Blog Engagement'],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'View recorded (or already counted today)'),
            new OA\Response(response: 404, description: 'Blog not found'),
        ]
    )]
    public function record(Request $request, int $blog): JsonResponse
    {
        $post         = Blog::findOrFail($blog);
        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');
        $ip           = $request->ip();

        $alreadyViewed = BlogView::alreadyViewed(
            $post->id,
            $user?->id,
            $guestSession?->id,
            $ip,
        );

        if (!$alreadyViewed) {
            BlogView::create([
                'blog_id'          => $post->id,
                'user_id'          => $user?->id,
                'guest_session_id' => $guestSession?->id,
                'ip_address'       => $ip,
                'user_agent'       => $request->userAgent(),
                'viewed_at'        => now(),
            ]);

            $post->refresh();
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'views_count'    => $post->views_count,
                'already_viewed' => $alreadyViewed,
            ],
        ]);
    }

    #[OA\Get(
        path: '/blogs/{blog}/views',
        summary: 'Get blog post view count',
        tags: ['Blog Engagement'],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'View count retrieved'),
            new OA\Response(response: 404, description: 'Blog not found'),
        ]
    )]
    public function count(Request $request, int $blog): JsonResponse
    {
        $post = Blog::findOrFail($blog);

        return response()->json([
            'success' => true,
            'data'    => ['views_count' => $post->views_count],
        ]);
    }
}

