<?php

namespace App\Http\Controllers\Api\Analytics;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\NewsLike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class NewsLikeController extends Controller
{
    #[OA\Post(
        path: '/news/{news}/likes',
        summary: 'Toggle like on a news article',
        tags: ['News Engagement'],
        parameters: [
            new OA\Parameter(name: 'news', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liked or unliked successfully'),
            new OA\Response(response: 403, description: 'No user or guest session found'),
            new OA\Response(response: 404, description: 'News article not found'),
        ]
    )]
    public function toggle(Request $request, int $news): JsonResponse
    {
        $article      = News::findOrFail($news);
        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');

        if (!$user && !$guestSession) {
            return response()->json([
                'success' => false,
                'message' => 'A user account or guest session is required to like articles.',
            ], 403);
        }

        $existing = NewsLike::findForViewer($article->id, $user?->id, $guestSession?->id);

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            NewsLike::create([
                'news_id'          => $article->id,
                'user_id'          => $user?->id,
                'guest_session_id' => $guestSession?->id,
            ]);
            $liked = true;
        }

        $article->refresh();

        return response()->json([
            'success' => true,
            'data'    => [
                'liked'       => $liked,
                'likes_count' => $article->likes_count,
            ],
        ]);
    }

    #[OA\Get(
        path: '/news/{news}/likes',
        summary: 'Get news article like count and liked status',
        tags: ['News Engagement'],
        parameters: [
            new OA\Parameter(name: 'news', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Like info retrieved'),
            new OA\Response(response: 404, description: 'News article not found'),
        ]
    )]
    public function show(Request $request, int $news): JsonResponse
    {
        $article      = News::findOrFail($news);
        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');

        $liked = NewsLike::findForViewer($article->id, $user?->id, $guestSession?->id) !== null;

        return response()->json([
            'success' => true,
            'data'    => [
                'liked'       => $liked,
                'likes_count' => $article->likes_count,
            ],
        ]);
    }
}

