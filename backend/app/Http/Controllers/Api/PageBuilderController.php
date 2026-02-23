<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PageBuilder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PageBuilderController extends Controller
{
    /**
     * Get all page builders for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $userType = $request->query('user_type', 'agent');
            $pageType = $request->query('page_type');

            $query = PageBuilder::where('user_id', $user->id)
                ->where('user_type', $userType);

            if ($pageType) {
                $query->where('page_type', $pageType);
            }

            $pageBuilders = $query->orderBy('updated_at', 'desc')->get();

            // Format each page builder for response
            $formattedPages = $pageBuilders->map(function ($page) {
                return $page->formatForResponse();
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPages,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching page builders: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch page builders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific page builder by ID or slug (for authenticated users).
     */
    public function show(Request $request, $identifier): JsonResponse
    {
        try {
            $user = $request->user();
            
            $pageBuilder = PageBuilder::with('user')
                ->where(function ($query) use ($identifier) {
                    $query->where('id', $identifier)
                        ->orWhere('page_slug', $identifier);
                });

            // If user is authenticated, check ownership for private pages
            if ($user) {
                $pageBuilder = $pageBuilder->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhere('is_published', true);
                });
            } else {
                // Public access only to published pages
                $pageBuilder = $pageBuilder->where('is_published', true);
            }

            $pageBuilder = $pageBuilder->first();

            if (!$pageBuilder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page builder not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $pageBuilder->formatForResponse(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching page builder: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch page builder',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a published page by slug (public access, no authentication required).
     */
    public function showBySlug(Request $request, $slug): JsonResponse
    {
        try {
            $pageBuilder = PageBuilder::with('user')
                ->where('page_slug', $slug)
                ->where('is_published', true)
                ->first();

            if (!$pageBuilder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page not found or not published',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $pageBuilder->formatForResponse(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching published page: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch page',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a page builder by slug (public access for editing, no auth required).
     */
    public function showBySlugPublic(Request $request, $slug): JsonResponse
    {
        try {
            $pageBuilder = PageBuilder::with('user')
                ->where('page_slug', $slug)
                ->first();

            if (!$pageBuilder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $pageBuilder->formatForResponse(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching page builder: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch page builder',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create or update a page builder.
     * Stores all page customization data as a single JSON field for flexibility.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            // Simplified validation - only require essential fields
            $validator = Validator::make($request->all(), [
                'user_type' => 'required|in:agent,broker',
                'page_type' => 'required|in:profile,property',
                'page_data' => 'required|array', // All page customization data
                'page_slug' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            
            // Check if page builder already exists for this user and page slug, or user_type + page_type
            $existingPageBuilder = null;
            if (isset($validated['page_slug']) && !empty($validated['page_slug'])) {
                $existingPageBuilder = PageBuilder::where('user_id', $user->id)
                    ->where('page_slug', $validated['page_slug'])
                    ->first();
            }
            
            if (!$existingPageBuilder) {
                $existingPageBuilder = PageBuilder::where('user_id', $user->id)
                    ->where('user_type', $validated['user_type'])
                    ->where('page_type', $validated['page_type'])
                    ->first();
            }

            // Prepare data for save
            $saveData = [
                'user_id' => $user->id,
                'user_type' => $validated['user_type'],
                'page_type' => $validated['page_type'],
                'page_data' => $validated['page_data'], // Store all customization as JSON
            ];

            // Handle slug if provided
            if (isset($validated['page_slug']) && !empty($validated['page_slug'])) {
                $saveData['page_slug'] = $validated['page_slug'];
            }

            if ($existingPageBuilder) {
                // Update existing page
                $existingPageBuilder->update($saveData);
                
                // Generate slug and URL if not provided
                if (!$existingPageBuilder->page_slug) {
                    $existingPageBuilder->page_slug = $existingPageBuilder->generateSlug();
                }
                if (!$existingPageBuilder->page_url) {
                    $existingPageBuilder->page_url = $existingPageBuilder->generateUrl();
                }
                $existingPageBuilder->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Page saved successfully',
                    'data' => $existingPageBuilder->formatForResponse(),
                ]);
            } else {
                // Create new page
                $pageBuilder = PageBuilder::create($saveData);
                
                // Generate slug and URL
                $pageBuilder->page_slug = $pageBuilder->generateSlug();
                $pageBuilder->page_url = $pageBuilder->generateUrl();
                $pageBuilder->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Page created successfully',
                    'data' => $pageBuilder->formatForResponse(),
                ], 201);
            }
        } catch (\Exception $e) {
            Log::error('Error saving page builder: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save page',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a page builder.
     * Uses the same store logic for consistency.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $pageBuilder = PageBuilder::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pageBuilder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page not found',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'page_data' => 'required|array', // All page customization data
                'page_slug' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            
            // Update page data
            $pageBuilder->page_data = $validated['page_data'];
            
            // Update slug if provided
            if (isset($validated['page_slug']) && !empty($validated['page_slug'])) {
                $pageBuilder->page_slug = $validated['page_slug'];
                $pageBuilder->page_url = $pageBuilder->generateUrl();
            }
            
            $pageBuilder->save();

            return response()->json([
                'success' => true,
                'message' => 'Page updated successfully',
                'data' => $pageBuilder->formatForResponse(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating page builder: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update page',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a page builder.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $pageBuilder = PageBuilder::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pageBuilder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page builder not found',
                ], 404);
            }

            $pageBuilder->delete();

            return response()->json([
                'success' => true,
                'message' => 'Page builder deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting page builder: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete page builder',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Publish/unpublish a page builder by slug.
     */
    public function publishBySlug(Request $request, $slug): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $pageBuilder = PageBuilder::where('page_slug', $slug)
                ->where('user_id', $user->id)
                ->first();

            if (!$pageBuilder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page builder not found',
                ], 404);
            }

            $pageBuilder->is_published = true;
            $pageBuilder->published_at = now();
            $pageBuilder->save();

            return response()->json([
                'success' => true,
                'message' => 'Page published successfully',
                'data' => $pageBuilder->formatForResponse(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error publishing page builder: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to publish page builder',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Publish/unpublish a page builder by ID.
     */
    public function publish(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $pageBuilder = PageBuilder::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pageBuilder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Page builder not found',
                ], 404);
            }

            $pageBuilder->is_published = !$pageBuilder->is_published;
            if ($pageBuilder->is_published) {
                $pageBuilder->published_at = now();
            } else {
                $pageBuilder->published_at = null;
            }
            $pageBuilder->save();

            return response()->json([
                'success' => true,
                'message' => $pageBuilder->is_published ? 'Page published successfully' : 'Page unpublished successfully',
                'data' => $pageBuilder->formatForResponse(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error publishing page builder: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to publish page builder',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
