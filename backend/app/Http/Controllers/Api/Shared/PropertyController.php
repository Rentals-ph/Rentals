<?php

namespace App\Http\Controllers\Api\Shared;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\FormatsValidationErrors;
use App\Domain\Properties\Models\Property;
use App\Domain\Properties\Services\ImageService;
use App\Http\Requests\Properties\CreatePropertyRequest;
use App\Http\Requests\Properties\BulkCreatePropertyRequest;
use App\Http\Requests\Properties\UpdatePropertyRequest;
use App\Http\Requests\Properties\UpdatePropertyStatusRequest;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\PropertyCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

class PropertyController extends Controller
{
    use FormatsValidationErrors;
    #[OA\Get(
        path: "/properties/featured",
        summary: "Get featured properties",
        tags: ["Properties"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of featured properties",
                content: new OA\JsonContent(
                    type: "array",
                    items: new OA\Items(type: "object")
                )
            ),
        ]
    )]
    public function featured(Request $request)
    {
        $query = Property::where('is_featured', true)
            ->with('agent');

        // Optional listing_type filter (for_rent / for_sale)
        if ($request->has('listing_type')) {
            $listingType = strtolower((string) $request->input('listing_type'));
            if (in_array($listingType, ['for_rent', 'for_sale'], true)) {
                $query->where('listing_type', $listingType);
            }
        }

        $properties = $query
            ->latest()
            ->take(10)
            ->get();

        return response()->json($properties);
    }

    #[OA\Get(
        path: "/properties",
        summary: "Get list of properties",
        tags: ["Properties"],
        parameters: [
            new OA\Parameter(
                name: "type",
                in: "query",
                required: false,
                description: "Filter by property type",
                schema: new OA\Schema(type: "string")
            ),
            new OA\Parameter(
                name: "location",
                in: "query",
                required: false,
                description: "Filter by location",
                schema: new OA\Schema(type: "string")
            ),
            new OA\Parameter(
                name: "search",
                in: "query",
                required: false,
                description: "Search in title and description",
                schema: new OA\Schema(type: "string")
            ),
            new OA\Parameter(
                name: "agent_id",
                in: "query",
                required: false,
                description: "Filter by agent ID",
                schema: new OA\Schema(type: "integer")
            ),
            new OA\Parameter(
                name: "page",
                in: "query",
                required: false,
                description: "Page number for pagination",
                schema: new OA\Schema(type: "integer", default: 1)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Paginated list of properties",
                content: new OA\JsonContent(
                    type: "object",
                    properties: [
                        new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                        new OA\Property(property: "current_page", type: "integer"),
                        new OA\Property(property: "per_page", type: "integer"),
                        new OA\Property(property: "total", type: "integer"),
                    ]
                )
            ),
        ]
    )]
    public function index(Request $request)
    {
        $query = Property::with('agent');

        // Filter by agent_id if provided
        if ($request->has('agent_id')) {
            $query->where('agent_id', $request->agent_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by listing_type (for_rent / for_sale) if provided
        if ($request->has('listing_type')) {
            $listingType = strtolower((string) $request->input('listing_type'));
            if (in_array($listingType, ['for_rent', 'for_sale'], true)) {
                $query->where('listing_type', $listingType);
            }
        }

        if ($request->has('location')) {
            $locationSearch = '%' . $request->location . '%';
            $query->where(function($q) use ($locationSearch) {
                $q->where('city', 'like', $locationSearch)
                  ->orWhere('state_province', 'like', $locationSearch)
                  ->orWhere('country', 'like', $locationSearch)
                  ->orWhere('street_address', 'like', $locationSearch);
            });
        }

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $perPage = (int) $request->input('per_page', 12);
        $perPage = max(1, min(100, $perPage));
        $properties = $query->latest()->paginate($perPage);

        // Image URL is automatically included via model accessor (getImageUrlAttribute)

        return new PropertyCollection($properties);
    }

    #[OA\Get(
        path: "/properties/{id}",
        summary: "Get property by ID",
        tags: ["Properties"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Property ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Property details",
                content: new OA\JsonContent(type: "object")
            ),
            new OA\Response(
                response: 404,
                description: "Property not found",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "No query results for model [App\\Models\\Property] {id}"),
                    ]
                )
            ),
        ]
    )]
    public function show($identifier)
    {
        // Support both numeric IDs (backward compat) and slugs
        $property = is_numeric($identifier)
            ? Property::with('agent')->findOrFail($identifier)
            : Property::with('agent')->where('slug', $identifier)->firstOrFail();

        return new PropertyResource($property);
    }

    #[OA\Post(
        path: "/properties",
        summary: "Create a new property",
        tags: ["Properties"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["title", "description", "type", "price", "bedrooms", "bathrooms"],
                    properties: [
                        new OA\Property(property: "title", type: "string"),
                        new OA\Property(property: "description", type: "string"),
                        new OA\Property(property: "type", type: "string"),
                        new OA\Property(property: "price", type: "number"),
                        new OA\Property(property: "price_type", type: "string"),
                        new OA\Property(property: "bedrooms", type: "integer"),
                        new OA\Property(property: "bathrooms", type: "integer"),
                        new OA\Property(property: "garage", type: "integer", nullable: true),
                        new OA\Property(property: "area", type: "integer", nullable: true),
                        new OA\Property(property: "lot_area", type: "integer", nullable: true),
                        new OA\Property(property: "floor_area_unit", type: "string", nullable: true),
                        new OA\Property(property: "amenities", type: "string", nullable: true),
                        new OA\Property(property: "furnishing", type: "string", nullable: true),
                        new OA\Property(property: "image", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "video_url", type: "string", nullable: true),
                        new OA\Property(property: "latitude", type: "string", nullable: true),
                        new OA\Property(property: "longitude", type: "string", nullable: true),
                        new OA\Property(property: "country", type: "string", nullable: true),
                        new OA\Property(property: "state_province", type: "string", nullable: true),
                        new OA\Property(property: "city", type: "string", nullable: true),
                        new OA\Property(property: "street_address", type: "string", nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Property created successfully",
                content: new OA\JsonContent(type: "object")
            ),
            new OA\Response(
                response: 401,
                description: "Unauthenticated",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Unauthenticated."),
                    ]
                )
            ),
        ]
    )]
    public function store(CreatePropertyRequest $request)
    {
        try {
            // Get authenticated user - middleware ensures user is authenticated
            $user = $request->user();
            
            if (!$user || (!$user->isAgent() && !$user->isBroker())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Agent or Broker authentication required.',
                ], 403);
            }

            // For brokers, check subscription limits
            if ($user->isBroker()) {
                $subscription = $user->activeSubscription;
                if (!$subscription || !$subscription->canCreateListing()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Listing limit reached. Please upgrade your plan.',
                    ], 403);
                }
            }

            $validated = $request->validated();

            // Resolve listing_type — default to for_rent
            $listingType = $validated['listing_type'] ?? 'for_rent';

            // Normalize price_type to capitalized format; null it out for for_sale properties
            if ($listingType === 'for_sale') {
                $validated['price_type'] = null;
            } elseif (isset($validated['price_type'])) {
                $validated['price_type'] = ucfirst(strtolower($validated['price_type']));
            }

            // Use database transaction for data integrity
            $property = \DB::transaction(function () use ($validated, $request, $user, $listingType) {
                // Handle multiple image uploads
                $imagePaths = [];
                
                // Handle multiple images array (prioritize this over single image)
                if ($request->hasFile('images')) {
                    foreach ($request->file('images') as $imageFile) {
                        $uploadedPath = ImageService::upload($imageFile, 'images/products');
                        if ($uploadedPath) {
                            $imagePaths[] = $uploadedPath;
                        }
                    }
                }
                
                // Handle single image (for backward compatibility, only if no images array)
                // This prevents duplicate uploads when both image and images[] are sent
                $mainImagePath = null;
                if (empty($imagePaths) && $request->hasFile('image')) {
                    $mainImagePath = ImageService::upload($request->file('image'), 'images/products');
                }
                
                // Determine final main image path and ensure no duplicates
                $finalMainImagePath = null;
                if (!empty($imagePaths)) {
                    // Use first image from images array as main image
                    $finalMainImagePath = $imagePaths[0];
                    // Remove duplicates from imagePaths array (in case same image was uploaded twice)
                    $imagePaths = array_values(array_unique($imagePaths));
                } elseif ($mainImagePath) {
                    // Use single uploaded image
                    $finalMainImagePath = $mainImagePath;
                    // Add single image to images array as well
                    $imagePaths[] = $mainImagePath;
                }

                // Parse amenities if it's a JSON string
                $amenities = null;
                if (isset($validated['amenities']) && is_string($validated['amenities'])) {
                    $amenities = json_decode($validated['amenities'], true);
                }

                // Create property in single operation
                $property = Property::create([
                    'title' => $validated['title'],
                    'slug'  => $validated['slug'] ?? null, // HasSlug auto-generates if null
                    'description' => $validated['description'],
                    'type' => $validated['type'],
                    'listing_type' => $listingType,
                    'price' => $validated['price'],
                    'price_type' => $validated['price_type'] ?? ($listingType === 'for_sale' ? null : 'Monthly'),
                    'bedrooms' => $validated['bedrooms'],
                    'bathrooms' => $validated['bathrooms'],
                    'garage' => $validated['garage'] ?? 0,
                    'area' => $validated['area'] ?? null,
                    'lot_area' => $validated['lot_area'] ?? null,
                    'floor_area_unit' => $validated['floor_area_unit'] ?? 'Square Meters',
                    'amenities' => $amenities,
                    'furnishing' => $validated['furnishing'] ?? null,
                    'image' => $finalMainImagePath, // Keep for backward compatibility
                    'image_path' => $finalMainImagePath,
                    'images' => !empty($imagePaths) ? $imagePaths : null,
                    'video_url' => $validated['video_url'] ?? null,
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                    'country' => $validated['country'] ?? 'Philippines',
                    'state_province' => $validated['state_province'] ?? null,
                    'city' => $validated['city'] ?? null,
                    'street_address' => $validated['street_address'] ?? null,
                    'agent_id' => $user->id,
                    'published_at' => now(),
                ]);

                // Store images in media table (new system)
                if ($finalMainImagePath) {
                    $property->storeMedia($finalMainImagePath, 'thumbnail');
                }
                foreach ($imagePaths as $index => $imgPath) {
                    $property->storeMedia($imgPath, 'gallery', $index);
                }

                // Update broker subscription usage if broker
                if ($user->isBroker()) {
                    $subscription = $user->activeSubscription;
                    if ($subscription) {
                        $subscription->increment('listings_used');
                    }
                }

                return $property;
            });

            // Image URL is automatically included via model accessor (getImageUrlAttribute)

            return response()->json([
                'success' => true,
                'message' => 'Property created successfully',
                'data' => new PropertyResource($property),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error creating property: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);
            
            $errorMessage = 'Database error occurred while creating the property.';
            if (str_contains($e->getMessage(), 'null value')) {
                $errorMessage = 'Missing required information. Please ensure all required fields are filled.';
            } elseif (str_contains($e->getMessage(), 'duplicate')) {
                $errorMessage = 'A property with similar information already exists.';
            } elseif (str_contains($e->getMessage(), 'foreign key')) {
                $errorMessage = 'Invalid reference. Please check your agent/team information.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error' => config('app.debug') ? $e->getMessage() : 'A database error occurred',
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Error creating property: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'An unexpected error occurred while creating the property.';
            if (str_contains($e->getMessage(), 'file')) {
                $errorMessage = 'File upload error. Please check your image file and try again.';
            } elseif (str_contains($e->getMessage(), 'permission')) {
                $errorMessage = 'Permission denied. You may not have access to create properties.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the property',
            ], 500);
        }
    }

    #[OA\Post(
        path: "/properties/bulk",
        summary: "Create multiple properties at once (bulk create)",
        tags: ["Properties"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["properties"],
                    properties: [
                        new OA\Property(
                            property: "properties",
                            type: "array",
                            description: "Array of property objects to create",
                            items: new OA\Items(type: "object")
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Properties created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean"),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                        new OA\Property(property: "created_count", type: "integer"),
                    ]
                )
            ),
            new OA\Response(
                response: 401,
                description: "Unauthenticated",
            ),
            new OA\Response(
                response: 403,
                description: "Unauthorized - Agent authentication required",
            ),
        ]
    )]
    public function bulkStore(BulkCreatePropertyRequest $request)
    {
        try {
            $user = $request->user();
            
            if (!$user || (!$user->isAgent() && !$user->isBroker())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Agent or Broker authentication required.',
                ], 403);
            }

            // For brokers, check subscription limits
            if ($user->isBroker()) {
                $subscription = $user->activeSubscription;
                if (!$subscription || !$subscription->canCreateListing()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Listing limit reached. Please upgrade your plan.',
                    ], 403);
                }
            }

            $request->validated(); // Validation handled by BulkCreatePropertyRequest

            $properties = $request->input('properties');
            $createdProperties = [];

            // Use single transaction for all properties
            DB::transaction(function () use ($properties, $user, &$createdProperties) {
                foreach ($properties as $propertyData) {
                    $property = Property::create([
                        'title' => $propertyData['title'],
                        'description' => $propertyData['description'],
                        'type' => $propertyData['type'],
                        'price' => $propertyData['price'],
                        'price_type' => $propertyData['price_type'] ?? 'Monthly',
                        'bedrooms' => $propertyData['bedrooms'],
                        'bathrooms' => $propertyData['bathrooms'],
                        'garage' => $propertyData['garage'] ?? 0,
                        'area' => $propertyData['area'] ?? null,
                        'lot_area' => $propertyData['lot_area'] ?? null,
                        'floor_area_unit' => $propertyData['floor_area_unit'] ?? 'Square Meters',
                        'amenities' => isset($propertyData['amenities']) && is_string($propertyData['amenities']) 
                            ? json_decode($propertyData['amenities'], true) 
                            : ($propertyData['amenities'] ?? null),
                        'furnishing' => $propertyData['furnishing'] ?? null,
                        'video_url' => $propertyData['video_url'] ?? null,
                        'latitude' => $propertyData['latitude'] ?? null,
                        'longitude' => $propertyData['longitude'] ?? null,
                        'country' => $propertyData['country'] ?? 'Philippines',
                        'state_province' => $propertyData['state_province'] ?? null,
                        'city' => $propertyData['city'] ?? null,
                        'street_address' => $propertyData['street_address'] ?? null,
                        'agent_id' => $user->id,
                        'published_at' => now(),
                    ]);

                    $createdProperties[] = $property;

                    // Update broker subscription usage if broker
                    if ($user->isBroker()) {
                        $subscription = $user->activeSubscription;
                        if ($subscription) {
                            $subscription->increment('listings_used');
                        }
                    }
                }
            });

            return response()->json([
                'success' => true,
                'message' => count($createdProperties) . ' properties created successfully',
                'data' => PropertyResource::collection($createdProperties),
                'created_count' => count($createdProperties),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error bulk creating properties: ' . $e->getMessage());
            
            $errorMessage = 'Database error occurred while creating the properties.';
            if (str_contains($e->getMessage(), 'null value')) {
                $errorMessage = 'Missing required information. Please ensure all required fields are filled.';
            } elseif (str_contains($e->getMessage(), 'duplicate')) {
                $errorMessage = 'One or more properties with similar information already exist.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error' => config('app.debug') ? $e->getMessage() : 'A database error occurred',
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Error bulk creating properties: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'An unexpected error occurred while creating the properties.';
            if (str_contains($e->getMessage(), 'file')) {
                $errorMessage = 'File upload error. Please check your image files and try again.';
            } elseif (str_contains($e->getMessage(), 'permission')) {
                $errorMessage = 'Permission denied. You may not have access to create properties.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the properties',
            ], 500);
        }
    }

    #[OA\Put(
        path: "/properties/{id}",
        summary: "Update a property",
        tags: ["Properties"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Property ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "title", type: "string"),
                        new OA\Property(property: "description", type: "string"),
                        new OA\Property(property: "type", type: "string"),
                        new OA\Property(property: "price", type: "number"),
                        new OA\Property(property: "price_type", type: "string"),
                        new OA\Property(property: "bedrooms", type: "integer"),
                        new OA\Property(property: "bathrooms", type: "integer"),
                        new OA\Property(property: "garage", type: "integer", nullable: true),
                        new OA\Property(property: "area", type: "integer", nullable: true),
                        new OA\Property(property: "lot_area", type: "integer", nullable: true),
                        new OA\Property(property: "floor_area_unit", type: "string", nullable: true),
                        new OA\Property(property: "amenities", type: "string", nullable: true),
                        new OA\Property(property: "furnishing", type: "string", nullable: true),
                        new OA\Property(property: "image", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "video_url", type: "string", nullable: true),
                        new OA\Property(property: "latitude", type: "string", nullable: true),
                        new OA\Property(property: "longitude", type: "string", nullable: true),
                        new OA\Property(property: "country", type: "string", nullable: true),
                        new OA\Property(property: "state_province", type: "string", nullable: true),
                        new OA\Property(property: "city", type: "string", nullable: true),
                        new OA\Property(property: "street_address", type: "string", nullable: true),
                        new OA\Property(property: "is_featured", type: "boolean", nullable: true),
                        new OA\Property(property: "published_at", type: "string", format: "date-time", nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Property updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean"),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(
                response: 403,
                description: "Unauthorized - You can only update your own properties",
            ),
            new OA\Response(
                response: 404,
                description: "Property not found",
            ),
        ]
    )]
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user || (!$user->isAgent() && !$user->isBroker())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Agent or Broker authentication required.',
                ], 403);
            }

            $property = Property::findOrFail($id);
            
            // Ensure the agent can only update their own properties
            if ($property->agent_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. You can only update your own properties.',
                ], 403);
            }

            // Debug: Log file information
            \Log::info('Update property request', [
                'has_file' => $request->hasFile('image'),
                'all_files' => $request->allFiles(),
                'method' => $request->method(),
                'content_type' => $request->header('Content-Type'),
                'input_keys' => array_keys($request->all()),
            ]);

            // Validate the request data
            // Use 'sometimes' to only validate fields that are present in the request
            $validated = $request->validated();

            // Resolve listing_type for this update (use new value or existing)
            $updateListingType = $validated['listing_type'] ?? $property->listing_type ?? 'for_rent';

            // Normalize price_type; null it out for for_sale properties
            if ($updateListingType === 'for_sale') {
                $validated['price_type'] = null;
            } elseif (isset($validated['price_type'])) {
                $validated['price_type'] = ucfirst(strtolower($validated['price_type']));
            }

            // Use database transaction for data integrity
            $property = \DB::transaction(function () use ($validated, $request, $property, $updateListingType) {
                // Handle multiple image uploads
                $newImagePaths = [];
                
                // Handle single image (for backward compatibility)
                if ($request->hasFile('image')) {
                    $uploadedFile = $request->file('image');
                    
                    \Log::info('Image file received', [
                        'has_file' => true,
                        'file_name' => $uploadedFile->getClientOriginalName(),
                        'file_size' => $uploadedFile->getSize(),
                        'mime_type' => $uploadedFile->getMimeType(),
                        'extension' => $uploadedFile->getClientOriginalExtension(),
                        'is_valid' => $uploadedFile->isValid(),
                    ]);
                    
                    // Delete old main image file if exists (use raw column to bypass accessor)
                    $oldImagePath = $property->getRawOriginal('image_path')
                                 ?? $property->getRawOriginal('image');
                    if ($oldImagePath) {
                        ImageService::delete($oldImagePath);
                    }

                    // Remove old thumbnail media record
                    $property->deleteMedia('thumbnail');
                    
                    // Upload new image
                    $imagePath = ImageService::upload($uploadedFile, 'images/products');
                    if ($imagePath) {
                        $validated['image'] = $imagePath;
                        $validated['image_path'] = $imagePath;
                        $newImagePaths[] = $imagePath;

                        // Store in media table (new system)
                        $property->storeMedia($imagePath, 'thumbnail');
                    } else {
                        \Log::error('ImageService::upload returned null');
                    }
                }
                
                // Handle multiple images array
                if ($request->hasFile('images')) {
                    // Get existing images to keep (from keep_images parameter or all existing)
                    $imagesToKeep = [];
                    if ($request->has('keep_images')) {
                        $keepImagesJson = $request->input('keep_images');
                        if ($keepImagesJson) {
                            $imagesToKeep = json_decode($keepImagesJson, true) ?? [];
                        }
                    } else {
                        // If no keep_images specified, keep all existing (use raw to bypass cast)
                        $rawImages = $property->getRawOriginal('images');
                        $existingImages = is_string($rawImages)
                            ? (json_decode($rawImages, true) ?? [])
                            : (is_array($rawImages) ? $rawImages : []);
                        $imagesToKeep = $existingImages;
                    }
                    
                    // Delete images that are not in the keep list
                    $rawImages = $property->getRawOriginal('images');
                    $allExistingImages = is_string($rawImages)
                        ? (json_decode($rawImages, true) ?? [])
                        : (is_array($rawImages) ? $rawImages : []);
                    foreach ($allExistingImages as $oldImagePath) {
                        if (!in_array($oldImagePath, $imagesToKeep)) {
                            ImageService::delete($oldImagePath);
                        }
                    }
                    
                    // Upload new images
                    foreach ($request->file('images') as $imageFile) {
                        $uploadedPath = ImageService::upload($imageFile, 'images/products');
                        if ($uploadedPath) {
                            $newImagePaths[] = $uploadedPath;
                        }
                    }
                    
                    // Merge: new images first, then kept existing images
                    // This ensures new images appear first in the gallery
                    $allImages = array_merge($newImagePaths, $imagesToKeep);
                    
                    // If we have multiple images, use first as main image
                    if (!empty($allImages) && !$request->hasFile('image')) {
                        $validated['image'] = $allImages[0];
                        $validated['image_path'] = $allImages[0];
                    }
                    
                    $validated['images'] = $allImages;

                    // Rebuild gallery media records
                    $property->deleteMedia('gallery');
                    foreach ($allImages as $index => $imgPath) {
                        $property->storeMedia($imgPath, 'gallery', $index);
                    }
                } elseif ($request->hasFile('image') && !empty($newImagePaths)) {
                    // If only single image uploaded, merge with existing images
                    $imagesToKeep = [];
                    if ($request->has('keep_images')) {
                        $keepImagesJson = $request->input('keep_images');
                        if ($keepImagesJson) {
                            $imagesToKeep = json_decode($keepImagesJson, true) ?? [];
                        }
                    } else {
                        $rawImages = $property->getRawOriginal('images');
                        $imagesToKeep = is_string($rawImages)
                            ? (json_decode($rawImages, true) ?? [])
                            : (is_array($rawImages) ? $rawImages : []);
                    }
                    // Add new image at the beginning
                    $mergedImages = array_merge([$newImagePaths[0]], $imagesToKeep);
                    $validated['images'] = $mergedImages;

                    // Rebuild gallery media records
                    $property->deleteMedia('gallery');
                    foreach ($mergedImages as $index => $imgPath) {
                        $property->storeMedia($imgPath, 'gallery', $index);
                    }
                } elseif ($request->has('keep_images')) {
                    // If only keep_images is provided (removing images without adding new ones)
                    $keepImagesJson = $request->input('keep_images');
                    if ($keepImagesJson) {
                        $imagesToKeep = json_decode($keepImagesJson, true) ?? [];
                        // Delete images not in keep list
                        $rawImages = $property->getRawOriginal('images');
                        $allExistingImages = is_string($rawImages)
                            ? (json_decode($rawImages, true) ?? [])
                            : (is_array($rawImages) ? $rawImages : []);
                        foreach ($allExistingImages as $oldImagePath) {
                            if (!in_array($oldImagePath, $imagesToKeep)) {
                                ImageService::delete($oldImagePath);
                            }
                        }
                        $validated['images'] = $imagesToKeep;
                        // Update main image if needed
                        if (!empty($imagesToKeep)) {
                            $validated['image'] = $imagesToKeep[0];
                            $validated['image_path'] = $imagesToKeep[0];
                        }

                        // Rebuild gallery media records to reflect removed images
                        $property->deleteMedia('gallery');
                        foreach ($imagesToKeep as $index => $imgPath) {
                            $property->storeMedia($imgPath, 'gallery', $index);
                        }
                    }
                }
                // If no new images and no keep_images, preserve existing images (don't set images in validated)

                // Parse amenities if it's a JSON string
                if (isset($validated['amenities']) && is_string($validated['amenities'])) {
                    $validated['amenities'] = json_decode($validated['amenities'], true);
                }

                // Convert empty strings to null for optional fields
                $optionalFields = ['garage', 'area', 'lot_area', 'video_url', 'city', 'state_province', 'street_address', 'furnishing', 'price_type', 'floor_area_unit'];
                foreach ($optionalFields as $field) {
                    if (isset($validated[$field]) && $validated[$field] === '') {
                        $validated[$field] = null;
                    }
                }

                // Ensure numeric fields are properly typed
                $numericFields = ['bedrooms', 'bathrooms', 'garage', 'area', 'lot_area'];
                foreach ($numericFields as $field) {
                    if (isset($validated[$field]) && $validated[$field] !== null) {
                        $validated[$field] = (int)$validated[$field];
                    }
                }

                if (isset($validated['price'])) {
                    $validated['price'] = (float)$validated['price'];
                }

                // Ensure listing_type is always set on update
                $validated['listing_type'] = $updateListingType;

                // Update the property with validated data
                $property->update($validated);

                // Refresh to get updated relationships
                $property->refresh();

                return $property;
            });

            // Load agent relationship
            $property->load('agent');

            return response()->json([
                'success' => true,
                'message' => 'Property updated successfully',
                'data' => new PropertyResource($property),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Property not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error updating property: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);
            
            $errorMessage = 'Database error occurred while updating the property.';
            if (str_contains($e->getMessage(), 'null value')) {
                $errorMessage = 'Missing required information. Please ensure all required fields are filled.';
            } elseif (str_contains($e->getMessage(), 'duplicate')) {
                $errorMessage = 'A property with similar information already exists.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error' => config('app.debug') ? $e->getMessage() : 'A database error occurred',
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Error updating property: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'An unexpected error occurred while updating the property.';
            if (str_contains($e->getMessage(), 'file')) {
                $errorMessage = 'File upload error. Please check your image file and try again.';
            } elseif (str_contains($e->getMessage(), 'permission')) {
                $errorMessage = 'Permission denied. You may not have access to update this property.';
            }
            
            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while updating the property',
            ], 500);
        }
    }

    /**
     * Update the listing status of a property.
     * Only the owning agent/broker may change this.
     *
     * PATCH /properties/{id}/status
     * Body: { status: 'available' | 'rented' | 'under_negotiation' | 'unlisted' }
     */
    public function updateStatus(Request $request, $identifier)
    {
        try {
            $user = $request->user();

            if (!$user || (!$user->isAgent() && !$user->isBroker())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Agent or Broker authentication required.',
                ], 403);
            }

            // Support both numeric IDs (backward compat) and slugs
            $property = is_numeric($identifier)
                ? Property::findOrFail($identifier)
                : Property::where('slug', $identifier)->firstOrFail();

            if ($property->agent_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. You can only update the status of your own properties.',
                ], 403);
            }

            $validated = $request->validated(); // Validation handled by UpdatePropertyStatusRequest

            $property->update(['status' => $validated['status']]);

            return response()->json([
                'success' => true,
                'message' => 'Property status updated to "' . $validated['status'] . '".',
                'data'    => $property->only(['id', 'title', 'status']),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Property not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e);
        } catch (\Exception $e) {
            \Log::error('Error updating property status: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating the property status.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    #[OA\Delete(
        path: "/properties/{id}",
        summary: "Delete a property",
        tags: ["Properties"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Property ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Property deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean"),
                        new OA\Property(property: "message", type: "string"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "Property not found",
            ),
        ]
    )]
    public function destroy(Request $request, $identifier)
    {
        try {
            $user = $request->user();
            
            if (!$user || (!$user->isAgent() && !$user->isBroker())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Agent or Broker authentication required.',
                ], 403);
            }

            // Support both numeric IDs (backward compat) and slugs
            $property = is_numeric($identifier)
                ? Property::findOrFail($identifier)
                : Property::where('slug', $identifier)->firstOrFail();
            
            // Ensure the agent can only delete their own properties
            if ($property->agent_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. You can only delete your own properties.',
                ], 403);
            }
            
            // Delete the physical file if it exists (use raw to bypass accessor)
            $rawImagePath = $property->getRawOriginal('image_path')
                         ?? $property->getRawOriginal('image');
            ImageService::delete($rawImagePath);

            // Remove all media records for this property
            $property->deleteMedia('thumbnail');
            $property->deleteMedia('gallery');
            
            // Delete the database record
            $property->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Property deleted successfully',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Property not found',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting property: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting the property',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }
}
