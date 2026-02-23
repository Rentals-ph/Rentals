<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

class NewsController extends Controller
{
    #[OA\Get(
        path: "/news",
        summary: "Get list of news",
        tags: ["News"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of news articles",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(type: "object")
                )
            ),
        ]
    )]
    public function index(Request $request)
    {
        try {
            $query = News::orderBy('published_at', 'desc')
                ->orderBy('created_at', 'desc');
            
            // Support pagination if requested
            if ($request->has('page') || $request->has('per_page')) {
                $perPage = $request->get('per_page', 10);
                $news = $query->paginate($perPage);
                
                // Image URL is automatically included via model accessor (getImageUrlAttribute)
                
                return response()->json($news);
            }
            
            // Return all news if no pagination requested
            $news = $query->get();
            
            // Image URL is automatically included via model accessor (getImageUrlAttribute)
            
            return response()->json($news);
        } catch (\Exception $e) {
            \Log::error('Error fetching news: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch news',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    #[OA\Get(
        path: "/news/{id}",
        summary: "Get news by ID",
        tags: ["News"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "News ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "News article details",
                content: new OA\JsonContent(type: "object")
            ),
            new OA\Response(
                response: 404,
                description: "News article not found",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "No query results for model [App\\Models\\News] {id}"),
                    ]
                )
            ),
        ]
    )]
    public function show($id)
    {
        $news = News::findOrFail($id);
        
        // Image URL is automatically included via model accessor (getImageUrlAttribute)
        
        return response()->json($news);
    }

    #[OA\Post(
        path: "/news",
        summary: "Create a new news article",
        tags: ["News"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["title", "content"],
                    properties: [
                        new OA\Property(property: "title", type: "string"),
                        new OA\Property(property: "content", type: "string"),
                        new OA\Property(property: "excerpt", type: "string", nullable: true),
                        new OA\Property(property: "category", type: "string", nullable: true),
                        new OA\Property(property: "author", type: "string", nullable: true),
                        new OA\Property(property: "image", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "published_at", type: "string", format: "date-time", nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "News article created successfully",
                content: new OA\JsonContent(type: "object")
            ),
        ]
    )]
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'category' => 'nullable|string|max:100',
            'author' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'published_at' => 'nullable|date',
        ]);

        // Handle image upload
        $imagePath = ImageService::upload($request->file('image'), 'images/posts');

        // Create the news article
        $news = News::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'excerpt' => $validated['excerpt'] ?? null,
            'category' => $validated['category'] ?? null,
            'author' => $validated['author'] ?? null,
            'image' => $imagePath, // Keep for backward compatibility
            'image_path' => $imagePath,
            'published_at' => $validated['published_at'] ?? now(),
        ]);

        // Image URL is automatically included via model accessor (getImageUrlAttribute)

        return response()->json([
            'success' => true,
            'message' => 'News article created successfully',
            'data' => $news,
        ], 201);
    }

    #[OA\Put(
        path: "/news/{id}",
        summary: "Update a news article",
        tags: ["News"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "News ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "title", type: "string"),
                        new OA\Property(property: "content", type: "string"),
                        new OA\Property(property: "excerpt", type: "string", nullable: true),
                        new OA\Property(property: "category", type: "string", nullable: true),
                        new OA\Property(property: "author", type: "string", nullable: true),
                        new OA\Property(property: "image", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "published_at", type: "string", format: "date-time", nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "News article updated successfully",
                content: new OA\JsonContent(type: "object")
            ),
        ]
    )]
    public function update(Request $request, $id)
    {
        $news = News::findOrFail($id);

        // Validate the request
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'excerpt' => 'nullable|string|max:500',
            'category' => 'nullable|string|max:100',
            'author' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'published_at' => 'nullable|date',
        ]);

        // Handle image upload if new image is provided
        if ($request->hasFile('image')) {
            // Delete old image if exists
            ImageService::delete($news->image_path);

            // Store the new image
            $imagePath = ImageService::upload($request->file('image'), 'images/posts');
            $validated['image'] = $imagePath;
            $validated['image_path'] = $imagePath;
        }

        // Update the news article
        $news->update($validated);

        // Image URL is automatically included via model accessor (getImageUrlAttribute)

        return response()->json([
            'success' => true,
            'message' => 'News article updated successfully',
            'data' => $news->fresh(),
        ], 200);
    }

    #[OA\Delete(
        path: "/news/{id}",
        summary: "Delete a news article",
        tags: ["News"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "News ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "News article deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean"),
                        new OA\Property(property: "message", type: "string"),
                    ]
                )
            ),
        ]
    )]
    public function destroy($id)
    {
        $news = News::findOrFail($id);

        // Delete the physical file if it exists
        ImageService::delete($news->image_path);

        // Delete the database record
        $news->delete();

        return response()->json([
            'success' => true,
            'message' => 'News article deleted successfully',
        ], 200);
    }
}

