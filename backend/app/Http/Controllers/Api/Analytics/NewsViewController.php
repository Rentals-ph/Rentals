<?php

namespace App\Http\Controllers\Api\Analytics;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\NewsView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class NewsViewController extends Controller
{
    #[OA\Post(
        path: '/news/{news}/views',
        summary: 'Record a news article view',
        tags: ['News Engagement'],
        parameters: [
            new OA\Parameter(name: 'news', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'View recorded (or already counted today)'),
            new OA\Response(response: 404, description: 'News article not found'),
        ]
    )]
    public function record(Request $request, int $news): JsonResponse
    {
        $article      = News::findOrFail($news);
        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');
        $ip           = $request->ip();

        $alreadyViewed = NewsView::alreadyViewed(
            $article->id,
            $user?->id,
            $guestSession?->id,
            $ip,
        );

        if (!$alreadyViewed) {
            NewsView::create([
                'news_id'          => $article->id,
                'user_id'          => $user?->id,
                'guest_session_id' => $guestSession?->id,
                'ip_address'       => $ip,
                'user_agent'       => $request->userAgent(),
                'viewed_at'        => now(),
            ]);

            $article->refresh();
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'views_count'    => $article->views_count,
                'already_viewed' => $alreadyViewed,
            ],
        ]);
    }

    #[OA\Get(
        path: '/news/{news}/views',
        summary: 'Get news article view count',
        tags: ['News Engagement'],
        parameters: [
            new OA\Parameter(name: 'news', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'View count retrieved'),
            new OA\Response(response: 404, description: 'News article not found'),
        ]
    )]
    public function count(Request $request, int $news): JsonResponse
    {
        $article = News::findOrFail($news);

        return response()->json([
            'success' => true,
            'data'    => ['views_count' => $article->views_count],
        ]);
    }
}

