<?php

namespace App\Http\Controllers\Api\Analytics;

use App\Http\Controllers\Controller;
use App\Domain\Content\Models\Blog;
use App\Domain\Content\Models\BlogComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class BlogCommentController extends Controller
{
    /**
     * List all top-level comments for a blog post, with their replies eager-loaded.
     */
    #[OA\Get(
        path: '/blogs/{blog}/comments',
        summary: 'List comments for a blog post',
        tags: ['Blog Engagement'],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Comments retrieved'),
            new OA\Response(response: 404, description: 'Blog not found'),
        ]
    )]
    public function index(Request $request, int $blog): JsonResponse
    {
        $post = Blog::findOrFail($blog);

        $comments = BlogComment::where('blog_id', $post->id)
            ->whereNull('parent_id')
            ->with([
                'user:id,first_name,last_name,image_path',
                'replies.user:id,first_name,last_name,image_path',
            ])
            ->withCount('likes')
            ->latest()
            ->get()
            ->map(function ($comment) {
                $comment->replies->each(function ($reply) {
                    $reply->loadCount('likes');
                });
                return $comment;
            });

        return response()->json([
            'success'        => true,
            'data'           => $comments,
            'comments_count' => $post->comments_count,
        ]);
    }

    /**
     * Post a new comment (or reply) on a blog post.
     *
     * Works for:
     *  - Authenticated registered users (no name/email required)
     *  - Guests — must supply name + email
     */
    #[OA\Post(
        path: '/blogs/{blog}/comments',
        summary: 'Post a comment on a blog post',
        tags: ['Blog Engagement'],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
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
                        new OA\Property(property: 'name', type: 'string', nullable: true, description: 'Required for guests'),
                        new OA\Property(property: 'email', type: 'string', format: 'email', nullable: true, description: 'Required for guests'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Comment posted'),
            new OA\Response(response: 403, description: 'Guest must provide name and email'),
            new OA\Response(response: 404, description: 'Blog or parent comment not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(CreateBlogCommentRequest $request, int $blog): JsonResponse
    {
        $post = Blog::findOrFail($blog);

        // Validation handled by CreateBlogCommentRequest
        $validated = $request->validated();

        $user         = $request->user();
        $guestSession = $request->attributes->get('guestSession');

        // Guests must supply a display name and email
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

        // Validate that parent comment belongs to this blog
        if (!empty($validated['parent_id'])) {
            $parent = BlogComment::where('id', $validated['parent_id'])
                ->where('blog_id', $post->id)
                ->first();

            if (!$parent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent comment does not belong to this blog post.',
                ], 404);
            }
        }

        $comment = BlogComment::create([
            'blog_id'          => $post->id,
            'user_id'          => $user?->id,
            'guest_session_id' => $guestSession?->id,
            'parent_id'        => $validated['parent_id'] ?? null,
            'name'             => $user ? $user->full_name : ($validated['name'] ?? null),
            'email'            => $user ? $user->email    : ($validated['email'] ?? null),
            'content'          => $validated['content'],
        ]);

        // Load user relation and likes count for response
        $comment->load('user:id,first_name,last_name,image_path');
        $comment->loadCount('likes');

        $post->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Comment posted successfully.',
            'data'    => [
                'comment'        => $comment,
                'comments_count' => $post->comments_count,
            ],
        ], 201);
    }

    /**
     * Delete a comment.
     *
     * Authorised callers:
     *  - The comment's own registered author
     *  - An admin or moderator
     *
     * When a parent comment is deleted, its Eloquent-cascade children are
     * destroyed at the DB level; we subtract their count manually.
     */
    #[OA\Delete(
        path: '/blogs/{blog}/comments/{comment}',
        summary: 'Delete a blog comment',
        tags: ['Blog Engagement'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'blog', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'comment', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Comment deleted'),
            new OA\Response(response: 403, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Comment not found'),
        ]
    )]
    public function destroy(Request $request, int $blog, int $comment): JsonResponse
    {
        $post    = Blog::findOrFail($blog);
        $comment = BlogComment::where('id', $comment)
            ->where('blog_id', $post->id)
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

        // Count direct replies so we can decrement the cached counter accurately
        // (DB-level cascade will delete them without firing Eloquent events).
        $childCount = $comment->replies()->count();

        $comment->delete();

        // Decrement: 1 (this comment) + number of cascade-deleted replies
        $post->decrement('comments_count', 1 + $childCount);

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted.',
            'data'    => ['comments_count' => $post->fresh()->comments_count],
        ]);
    }
}

