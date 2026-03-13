<?php

namespace App\Http\Controllers\Api\Shared;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

class BlogController extends Controller
{
    #[OA\Get(
        path: "/blogs",
        summary: "Get list of blogs",
        tags: ["Blogs"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of latest blogs (max 10)",
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
            $query = Blog::orderBy('published_at', 'desc')
                ->orderBy('created_at', 'desc');
            
            // Support pagination if requested
            if ($request->has('page') || $request->has('per_page')) {
                $perPage = $request->get('per_page', 10);
                $blogs = $query->paginate($perPage);
                
                // Image URL is automatically included via model accessor (getImageUrlAttribute)
                
                return response()->json($blogs);
            }
            
            // Return all blogs if no pagination requested
            $blogs = $query->get();
            
            // Image URL is automatically included via model accessor (getImageUrlAttribute)
            
            return response()->json($blogs);
        } catch (\Exception $e) {
            \Log::error('Error fetching blogs: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to fetch blogs',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    #[OA\Get(
        path: "/blogs/{id}",
        summary: "Get blog by ID",
        tags: ["Blogs"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Blog ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Blog details",
                content: new OA\JsonContent(type: "object")
            ),
            new OA\Response(
                response: 404,
                description: "Blog not found",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "No query results for model [App\\Models\\Blog] {id}"),
                    ]
                )
            ),
        ]
    )]
    public function show($identifier)
    {
        // Support both numeric IDs (backward compat) and slugs
        $blog = is_numeric($identifier)
            ? Blog::findOrFail($identifier)
            : Blog::where('slug', $identifier)->firstOrFail();

        return response()->json($blog);
    }

    #[OA\Post(
        path: "/blogs",
        summary: "Create a new blog post",
        tags: ["Blogs"],
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
                description: "Blog created successfully",
                content: new OA\JsonContent(type: "object")
            ),
        ]
    )]
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'slug'         => 'nullable|string|max:255|unique:blogs,slug|regex:/^[a-z0-9-]+$/',
            'content'      => 'required|string',
            'excerpt'      => 'nullable|string|max:500',
            'category'     => 'nullable|string|max:100',
            'author'       => 'nullable|string|max:255',
            'image'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'published_at' => 'nullable|date',
        ]);

        // Handle image upload
        $imagePath = ImageService::upload($request->file('image'), 'images/posts');

        // Create the blog post
        $blog = Blog::create([
            'title'   => $validated['title'],
            'slug'    => $validated['slug'] ?? null, // HasSlug auto-generates if null
            'content' => $validated['content'],
            'excerpt' => $validated['excerpt'] ?? null,
            'category' => $validated['category'] ?? null,
            'author' => $validated['author'] ?? null,
            'image' => $imagePath, // Keep for backward compatibility
            'image_path' => $imagePath,
            'published_at' => $validated['published_at'] ?? now(),
        ]);

        // Store in media table (new system)
        if ($imagePath) {
            $blog->storeMedia($imagePath, 'thumbnail');
        }

        // Image URL is automatically included via model accessor (getImageUrlAttribute)

        return response()->json([
            'success' => true,
            'message' => 'Blog created successfully',
            'data' => $blog,
        ], 201);
    }

    #[OA\Put(
        path: "/blogs/{id}",
        summary: "Update a blog post",
        tags: ["Blogs"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Blog ID",
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
                description: "Blog updated successfully",
                content: new OA\JsonContent(type: "object")
            ),
        ]
    )]
    public function update(Request $request, $id)
    {
        $blog = is_numeric($id)
            ? Blog::findOrFail($id)
            : Blog::where('slug', $id)->firstOrFail();

        // Validate the request
        $validated = $request->validate([
            'title'        => 'sometimes|required|string|max:255',
            'slug'         => 'nullable|string|max:255|unique:blogs,slug,' . $blog->id . '|regex:/^[a-z0-9-]+$/',
            'content'      => 'sometimes|required|string',
            'excerpt'      => 'nullable|string|max:500',
            'category'     => 'nullable|string|max:100',
            'author'       => 'nullable|string|max:255',
            'image'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'published_at' => 'nullable|date',
        ]);

        // Handle image upload if new image is provided
        if ($request->hasFile('image')) {
            // Delete old image file if exists
            $oldPath = $blog->getRawOriginal('image_path') ?? $blog->getRawOriginal('image');
            ImageService::delete($oldPath);

            // Remove old media record(s) for this collection
            $blog->deleteMedia('thumbnail');

            // Store the new image
            $imagePath = ImageService::upload($request->file('image'), 'images/posts');
            $validated['image'] = $imagePath;
            $validated['image_path'] = $imagePath;

            // Store in media table (new system)
            if ($imagePath) {
                $blog->storeMedia($imagePath, 'thumbnail');
            }
        }

        // Update the blog post
        $blog->update($validated);

        // Image URL is automatically included via model accessor (getImageUrlAttribute)

        return response()->json([
            'success' => true,
            'message' => 'Blog updated successfully',
            'data' => $blog->fresh(),
        ], 200);
    }

    #[OA\Delete(
        path: "/blogs/{id}",
        summary: "Delete a blog post",
        tags: ["Blogs"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Blog ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Blog deleted successfully",
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
        $blog = is_numeric($id)
            ? Blog::findOrFail($id)
            : Blog::where('slug', $id)->firstOrFail();

        // Delete the physical file if it exists
        $oldPath = $blog->getRawOriginal('image_path') ?? $blog->getRawOriginal('image');
        ImageService::delete($oldPath);

        // Remove media records
        $blog->deleteMedia('thumbnail');

        // Delete the database record
        $blog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Blog deleted successfully',
        ], 200);
    }
}

