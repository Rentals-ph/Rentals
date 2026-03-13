<?php

namespace App\Http\Controllers\Api\Analytics;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\NewsComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class NewsCommentController extends Controller
{
    #[OA\Get(
        path: '/news/{news}/comments',
        summary: 'List comments for a news article',
        tags: ['News Engagement'],
        parameters: [
            new OA\Parameter(name: 'news', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Comments retrieved'),
            new OA\Response(response: 404, description: 'News article not found'),
        ]
    )]
    public function index(Request $request, int $news): JsonResponse
    {
        $article = News::findOrFail($news);

        $comments = NewsComment::where('news_id', $article->id)
            ->whereNull('parent_id')
            ->with([
                'user:id,first_name,last_name,image_path',
                'replies.user:id,first_name,last_name,image_path',
            ])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success'        => true,
            'data'           => $comments,
            'comments_count' => $article->comments_count,
        ]);
    }

    #[OA\Post(
        path: '/news/{news}/comments',
        summary: 'Post a comment on a news article',
        tags: ['News Engagement'],
        parameters: [
            new OA\Parameter(name: 'news', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'application/json',
                schema: new OA\Schema(
                    required: ['content'],
                    properties: [
                        new OA\Property(property: 'content', type: 'string', maxLength: 2000),
                        new OA\Property(property: 'parent_id', type: 'integer', nullable: true),
                        new OA\Property(property: 'name', type: 'string', nullable: true),
                        new OA\Property(property: 'email', type: 'string', format: 'email', nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Comment posted'),
            new OA\Response(response: 403, description: 'Guest must provide name and email'),
            new OA\Response(response: 404, description: 'Article or parent comment not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request, int $news): JsonResponse
    {
        $article = News::findOrFail($news);

        $validated = $request->validate([
            'content'   => 'required|string|max:2000',
            'parent_id' => 'nullable|integer|exists:news_comments,id',
            'name'      => 'nullable|string|max:255',
            'email'     => 'nullable|email|max:255',
        ]);

        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');

        if (!$user) {
            if (empty($validated['name']) || empty($validated['email'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guests must provide a name and email to comment.',
                    'errors'  => [
                        'name'  => empty($validated['name']) ? ['The name field is required for guests.'] : [],
                        'email' => empty($validated['email']) ? ['The email field is required for guests.'] : [],
                    ],
                ], 403);
            }
        }

        if (!empty($validated['parent_id'])) {
            $parent = NewsComment::where('id', $validated['parent_id'])
                ->where('news_id', $article->id)
                ->first();

            if (!$parent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent comment does not belong to this news article.',
                ], 404);
            }
        }

        $comment = NewsComment::create([
            'news_id'          => $article->id,
            'user_id'          => $user?->id,
            'guest_session_id' => $guestSession?->id,
            'parent_id'        => $validated['parent_id'] ?? null,
            'name'             => $user ? $user->full_name : ($validated['name'] ?? null),
            'email'            => $user ? $user->email    : ($validated['email'] ?? null),
            'content'          => $validated['content'],
        ]);

        $comment->load('user:id,first_name,last_name,image_path');
        $article->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Comment posted successfully.',
            'data'    => [
                'comment'        => $comment,
                'comments_count' => $article->comments_count,
            ],
        ], 201);
    }

    #[OA\Delete(
        path: '/news/{news}/comments/{comment}',
        summary: 'Delete a news comment',
        tags: ['News Engagement'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'news', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'comment', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Comment deleted'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Comment not found'),
        ]
    )]
    public function destroy(Request $request, int $news, int $comment): JsonResponse
    {
        $article = News::findOrFail($news);
        $comment = NewsComment::where('id', $comment)
            ->where('news_id', $article->id)
            ->firstOrFail();

        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $isOwner    = $comment->user_id === $user->id;
        $isAdminMod = $user->isAdmin();

        if (!$isOwner && !$isAdminMod) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorised to delete this comment.',
            ], 403);
        }

        $childCount = $comment->replies()->count();
        $comment->delete();
        $article->decrement('comments_count', 1 + $childCount);

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted.',
            'data'    => ['comments_count' => $article->fresh()->comments_count],
        ]);
    }
}

