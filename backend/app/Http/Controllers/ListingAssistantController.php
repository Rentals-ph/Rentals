<?php

namespace App\Http\Controllers;

use App\Models\ListingAssistantConversation;
use App\Models\Property;
use App\Services\ListingAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

class ListingAssistantController extends Controller
{
    public function __construct(protected ListingAssistantService $listingAssistantService)
    {
    }

    /**
     * Process a message from the agent and extract property data
     */
    #[OA\Post(
        path: "/listing/assistant",
        summary: "Process agent message for listing assistant",
        description: "Send a message to the AI listing assistant. The AI will extract property data, identify missing fields, and provide a conversational response.",
        tags: ["Listing Assistant"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["message"],
                    properties: [
                        new OA\Property(
                            property: "message",
                            type: "string",
                            description: "The agent's message about the property",
                            example: "I have a 3 bedroom house in Quezon City, 7.5 million"
                        ),
                        new OA\Property(
                            property: "conversation_id",
                            type: "string",
                            nullable: true,
                            description: "Existing conversation ID or null for new conversation",
                            example: "listing_abc123_1234567890"
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Successfully processed message",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "conversation_id", type: "string"),
                        new OA\Property(property: "extracted_data", type: "object"),
                        new OA\Property(property: "missing_fields", type: "array", items: new OA\Items(type: "string")),
                        new OA\Property(property: "skipped_fields", type: "array", items: new OA\Items(type: "string")),
                        new OA\Property(property: "ai_response", type: "string"),
                        new OA\Property(property: "form_ready", type: "boolean"),
                        new OA\Property(property: "can_generate_description", type: "boolean"),
                        new OA\Property(property: "description", type: "string", nullable: true),
                        new OA\Property(property: "warnings", type: "array", items: new OA\Items(type: "string")),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error"
            ),
        ]
    )]
    public function processMessage(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|string|max:100',
        ]);

        $userId = auth('sanctum')->id();

        $result = $this->listingAssistantService->processMessage(
            $request->input('message'),
            $request->input('conversation_id'),
            $userId
        );

        return response()->json($result);
    }

    /**
     * Start a new listing conversation
     */
    #[OA\Post(
        path: "/listing/assistant/new",
        summary: "Start new listing assistant conversation",
        description: "Create a new conversation with the listing assistant. Returns a welcome message and empty form state.",
        tags: ["Listing Assistant"],
        responses: [
            new OA\Response(
                response: 200,
                description: "New conversation started",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "conversation_id", type: "string"),
                        new OA\Property(property: "ai_response", type: "string"),
                        new OA\Property(property: "extracted_data", type: "object"),
                        new OA\Property(property: "missing_fields", type: "array", items: new OA\Items(type: "string")),
                        new OA\Property(property: "form_ready", type: "boolean"),
                    ]
                )
            ),
        ]
    )]
    public function startNewConversation(): JsonResponse
    {
        try {
            $userId = auth('sanctum')->id(); // Can be null for public access
            $result = $this->listingAssistantService->startNewConversation($userId);
            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Failed to start new conversation: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Failed to start conversation. Please try again.',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Reset an existing conversation
     */
    #[OA\Post(
        path: "/listing/assistant/{conversationId}/reset",
        summary: "Reset listing assistant conversation",
        description: "Clear all extracted data and start fresh with the same conversation ID.",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Conversation reset successfully"
            ),
        ]
    )]
    public function resetConversation(string $conversationId): JsonResponse
    {
        $result = $this->listingAssistantService->resetConversation($conversationId);
        return response()->json($result);
    }

    /**
     * Generate property description on demand
     */
    #[OA\Post(
        path: "/listing/assistant/{conversationId}/generate-description",
        summary: "Generate property description",
        description: "Generate a professional property description based on the extracted data. Requires minimum: property_type, location, bedrooms, price.",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: "template",
                        type: "string",
                        enum: ["narrative", "bulleted", "short", "luxury", "storytelling"],
                        description: "Description template style",
                        example: "narrative"
                    ),
                    new OA\Property(
                        property: "agent_context",
                        type: "string",
                        nullable: true,
                        description: "Additional context or ideas from the agent to guide description generation",
                        example: "Emphasize the nearby schools and family-friendly neighborhood"
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Description generated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean"),
                        new OA\Property(property: "description", type: "string"),
                        new OA\Property(property: "extracted_data", type: "object"),
                        new OA\Property(property: "template", type: "string"),
                    ]
                )
            ),
            new OA\Response(
                response: 400,
                description: "Insufficient data for description generation"
            ),
        ]
    )]
    public function generateDescription(Request $request, string $conversationId): JsonResponse
    {
        $template = $request->input('template', 'narrative');
        $agentContext = $request->input('agent_context', '');
        
        // Ensure agentContext is a string (convert null to empty string)
        $agentContext = is_string($agentContext) ? $agentContext : '';
        
        // Validate template
        $validTemplates = ['narrative', 'bulleted', 'short', 'luxury', 'storytelling'];
        if (!in_array($template, $validTemplates)) {
            $template = 'narrative';
        }
        
        $result = $this->listingAssistantService->generateDescription($conversationId, $template, $agentContext);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }

    /**
     * Get conversation details
     */
    #[OA\Get(
        path: "/listing/assistant/{conversationId}",
        summary: "Get listing assistant conversation",
        description: "Retrieve the current state of a listing assistant conversation including extracted data and message history.",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Conversation details",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "conversation_id", type: "string"),
                        new OA\Property(property: "extracted_data", type: "object"),
                        new OA\Property(property: "missing_fields", type: "array", items: new OA\Items(type: "string")),
                        new OA\Property(property: "skipped_fields", type: "array", items: new OA\Items(type: "string")),
                        new OA\Property(property: "form_ready", type: "boolean"),
                        new OA\Property(property: "messages", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "Conversation not found"
            ),
        ]
    )]
    public function getConversation(string $conversationId): JsonResponse
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json([
                'error' => 'Conversation not found',
            ], 404);
        }

        $missingFields = $this->listingAssistantService->identifyMissingFields(
            $conversation->extracted_data ?? [],
            $conversation->skipped_fields ?? []
        );

        return response()->json([
            'conversation_id' => $conversation->conversation_id,
            'extracted_data' => $conversation->extracted_data ?? [],
            'missing_fields' => $missingFields,
            'skipped_fields' => $conversation->skipped_fields ?? [],
            'form_ready' => $conversation->isFormReady(),
            'can_generate_description' => $conversation->canGenerateDescription(),
            'messages' => $conversation->messages ?? [],
            'status' => $conversation->status,
            'current_step' => $conversation->current_step,
        ]);
    }

    /**
     * Update extracted data manually
     */
    #[OA\Patch(
        path: "/listing/assistant/{conversationId}/data",
        summary: "Update extracted data manually",
        description: "Manually update or correct extracted property data without going through the AI.",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(
                            property: "data",
                            type: "object",
                            description: "Property data fields to update"
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Data updated successfully"
            ),
            new OA\Response(
                response: 404,
                description: "Conversation not found"
            ),
        ]
    )]
    public function updateData(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json([
                'error' => 'Conversation not found',
            ], 404);
        }

        $newData = $request->input('data', []);
        $conversation->updateExtractedData($newData);

        $missingFields = $this->listingAssistantService->identifyMissingFields(
            $conversation->extracted_data ?? [],
            $conversation->skipped_fields ?? []
        );

        $warnings = $this->listingAssistantService->validateExtractedData($conversation->extracted_data ?? []);

        return response()->json([
            'success' => true,
            'conversation_id' => $conversation->conversation_id,
            'extracted_data' => $conversation->extracted_data,
            'missing_fields' => $missingFields,
            'form_ready' => $conversation->isFormReady(),
            'can_generate_description' => $conversation->canGenerateDescription(),
            'warnings' => $warnings,
        ]);
    }

    /**
     * List all conversations for the authenticated user
     */
    #[OA\Get(
        path: "/listing/assistant/conversations",
        summary: "List user's listing assistant conversations",
        description: "Get all listing assistant conversations for the authenticated user.",
        tags: ["Listing Assistant"],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of conversations"
            ),
        ]
    )]
    public function listConversations(): JsonResponse
    {
        $userId = auth('sanctum')->id();

        if (!$userId) {
            return response()->json([
                'conversations' => [],
            ]);
        }

        $conversations = ListingAssistantConversation::where('user_id', $userId)
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(function ($conv) {
                return [
                    'conversation_id' => $conv->conversation_id,
                    'status' => $conv->status,
                    'form_ready' => $conv->isFormReady(),
                    'property_name' => $conv->extracted_data['property_name'] ?? null,
                    'property_type' => $conv->extracted_data['property_type'] ?? null,
                    'location' => $conv->extracted_data['location'] ?? null,
                    'last_message_at' => $conv->last_message_at,
                    'created_at' => $conv->created_at,
                ];
            });

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    /**
     * Delete a conversation
     */
    #[OA\Delete(
        path: "/listing/assistant/{conversationId}",
        summary: "Delete listing assistant conversation",
        description: "Delete a listing assistant conversation and all its data.",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Conversation deleted successfully"
            ),
            new OA\Response(
                response: 404,
                description: "Conversation not found"
            ),
        ]
    )]
    public function deleteConversation(string $conversationId): JsonResponse
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json([
                'error' => 'Conversation not found',
            ], 404);
        }

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully',
        ]);
    }

    /**
     * Submit the listing (convert to actual property)
     */
    #[OA\Post(
        path: "/listing/assistant/{conversationId}/submit",
        summary: "Submit listing from assistant",
        description: "Convert the extracted data into an actual property listing. Only works when form_ready is true.",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Listing submitted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean"),
                        new OA\Property(property: "property_id", type: "integer"),
                        new OA\Property(property: "message", type: "string"),
                    ]
                )
            ),
            new OA\Response(
                response: 400,
                description: "Form not ready - missing required fields"
            ),
        ]
    )]
    public function submitListing(string $conversationId): JsonResponse
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json([
                'error' => 'Conversation not found',
            ], 404);
        }

        if (!$conversation->isFormReady()) {
            $missingFields = $conversation->getMissingFields();
            return response()->json([
                'success' => false,
                'error' => 'Form not ready. Missing required fields.',
                'missing_fields' => $missingFields,
            ], 400);
        }

        $data = $conversation->extracted_data;

        // Extract image paths from the uploaded images
        $imagePaths = [];
        if (!empty($data['images']) && is_array($data['images'])) {
            foreach ($data['images'] as $image) {
                if (isset($image['path'])) {
                    $imagePaths[] = $image['path'];
                }
            }
        }

        // Set the main image (first image) and all images for gallery
        // The 'images' array includes ALL images (including main) for the gallery view
        $mainImagePath = !empty($imagePaths) ? $imagePaths[0] : null;

        // Map extracted data to property model fields
        $propertyData = [
            'title' => $data['property_name'] ?? 'Untitled Property',
            'description' => $data['description'] ?? '',
            'description_template' => $data['description_template'] ?? null,
            'ai_generated_description' => $data['ai_generated_description'] ?? null,
            'type' => $this->mapPropertyType($data['property_type'] ?? 'house'),
            'listing_type' => in_array($data['status'] ?? null, ['for_sale', 'pre_selling']) ? 'for_sale' : 'for_rent',
            'price' => $data['price'] ?? 0,
            'price_type' => $this->mapPriceType($data['price_type'] ?? null, $data['status'] ?? null),
            'bedrooms' => $data['bedrooms'] ?? 0,
            'bathrooms' => $data['bathrooms'] ?? 0,
            'garage' => $data['parking_slots'] ?? 0,
            'area' => $data['area_sqm'] ?? null,
            'lot_area' => $data['lot_area_sqm'] ?? null,
            'floor_area_unit' => 'Square Meters',
            'amenities' => $data['amenities'] ?? [],
            'furnishing' => $this->mapFurnishingStatus($data['furnishing_status'] ?? null),
            'city' => Str::limit($data['location'] ?? '', 100, ''),
            'street_address' => $data['address'] ?? (strlen($data['location'] ?? '') > 100 ? ($data['location'] ?? '') : ''),
            'country' => 'Philippines',
            'latitude' => isset($data['latitude']) ? (string) $data['latitude'] : null,
            'longitude' => isset($data['longitude']) ? (string) $data['longitude'] : null,
            'is_featured' => false,
            'agent_id' => auth('sanctum')->id(),
            'published_at' => now(),
            'draft_status' => 'published',
            'image_path' => $mainImagePath,
            'images' => $imagePaths, // All images including main for gallery
        ];

        $property = Property::create($propertyData);

        // Update conversation status
        $conversation->status = ListingAssistantConversation::STATUS_SUBMITTED;
        $conversation->save();

        return response()->json([
            'success' => true,
            'property_id' => $property->id,
            'message' => 'Listing submitted successfully!',
            'property' => $property,
        ]);
    }

    /**
     * Upload images for a listing conversation
     *
     * @OA\Post(
     *     path="/api/listing/assistant/{conversationId}/upload-images",
     *     summary="Upload images for listing",
     *     tags={"Listing Assistant"},
     *     @OA\Parameter(name="conversationId", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(property="images[]", type="array", @OA\Items(type="string", format="binary"))
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Images uploaded successfully"),
     *     @OA\Response(response=404, description="Conversation not found")
     * )
     */
    public function uploadImages(Request $request, string $conversationId)
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        // Check if files were actually received (may fail silently if PHP limits exceeded)
        if (!$request->hasFile('images')) {
            return response()->json([
                'success' => false,
                'error' => 'No images received. File may exceed PHP upload limits (increase post_max_size and upload_max_filesize in php.ini).',
            ], 422);
        }

        $request->validate([
            'images' => 'required|array|min:1|max:30',
            'images.*' => 'required|file|mimetypes:image/jpeg,image/png,image/gif,image/webp|max:10240', // 10MB per image
        ]);

        $uploadedImages = [];
        $currentImages = $conversation->extracted_data['images'] ?? [];

        foreach ($request->file('images') as $image) {
            $filename = uniqid('listing_') . '_' . time() . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('listing-assistant/' . $conversationId, $filename, 'public');
            
            $uploadedImages[] = [
                'path' => $path,
                'url' => asset('storage/' . $path),
                'original_name' => $image->getClientOriginalName(),
                'size' => $image->getSize(),
                'mime_type' => $image->getMimeType(),
            ];
        }

        // Merge with existing images
        $allImages = array_merge($currentImages, $uploadedImages);
        
        // Update extracted data
        $extractedData = $conversation->extracted_data;
        $extractedData['images'] = $allImages;
        $conversation->extracted_data = $extractedData;
        $conversation->save();

        return response()->json([
            'success' => true,
            'images' => $allImages,
            'message' => count($uploadedImages) . ' image(s) uploaded successfully',
        ]);
    }

    /**
     * Delete an image from the listing conversation
     *
     * @OA\Delete(
     *     path="/api/listing/assistant/{conversationId}/images/{imageIndex}",
     *     summary="Delete an image from listing",
     *     tags={"Listing Assistant"},
     *     @OA\Parameter(name="conversationId", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Parameter(name="imageIndex", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Image deleted successfully"),
     *     @OA\Response(response=404, description="Conversation or image not found")
     * )
     */
    public function deleteImage(Request $request, string $conversationId, int $imageIndex)
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        $extractedData = $conversation->extracted_data;
        $images = $extractedData['images'] ?? [];

        if (!isset($images[$imageIndex])) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        // Delete the file from storage
        $imagePath = $images[$imageIndex]['path'] ?? null;
        if ($imagePath && Storage::disk('public')->exists($imagePath)) {
            Storage::disk('public')->delete($imagePath);
        }

        // Remove from array
        array_splice($images, $imageIndex, 1);
        $extractedData['images'] = $images;
        $conversation->extracted_data = $extractedData;
        $conversation->save();

        return response()->json([
            'success' => true,
            'images' => $images,
            'message' => 'Image deleted successfully',
        ]);
    }

    /**
     * Map property type to database format
     */
    protected function mapPropertyType(string $type): string
    {
        $mapping = [
            'house' => 'House',
            'condo' => 'Condominium',
            'apartment' => 'Apartment',
            'lot' => 'Lot',
            'commercial' => 'Commercial Spaces',
            'townhouse' => 'Townhouse',
            'studio' => 'Studio',
            'bedspace' => 'Bedspace',
            'warehouse' => 'Warehouse',
            'office' => 'Office',
        ];

        return $mapping[strtolower($type)] ?? 'House';
    }

    /**
     * Map furnishing status to database format
     */
    protected function mapFurnishingStatus(?string $status): ?string
    {
        if (!$status) {
            return null;
        }

        $mapping = [
            'unfurnished' => 'Unfurnished',
            'semi_furnished' => 'Semi-Furnished',
            'semi-furnished' => 'Semi-Furnished',
            'fully_furnished' => 'Furnished',
            'fully-furnished' => 'Furnished',
            'furnished' => 'Furnished',
        ];

        return $mapping[strtolower($status)] ?? null;
    }

    /**
     * Map price_type to database format (valid values: Monthly, Weekly, Daily, Yearly)
     */
    protected function mapPriceType(?string $priceType, ?string $status): ?string
    {
        // For sales, price_type is not applicable - set to null not "total"
        if ($status === 'for_sale' || $status === 'pre_selling') {
            return null;
        }

        // If not set for rentals, default to Monthly
        if (!$priceType && ($status === 'for_rent' || !$status)) {
            return 'Monthly';
        }

        if (!$priceType) {
            return null;
        }

        // Map various formats to valid capitalized values
        $mapping = [
            'monthly' => 'Monthly',
            'weekly' => 'Weekly',
            'daily' => 'Daily',
            'yearly' => 'Yearly',
            'total' => null, // "total" is not valid for price_type
            'Monthly' => 'Monthly',
            'Weekly' => 'Weekly',
            'Daily' => 'Daily',
            'Yearly' => 'Yearly',
        ];

        return $mapping[$priceType] ?? 'Monthly';
    }

    /**
     * Auto-save draft progress after each step
     */
    #[OA\Post(
        path: "/listing/assistant/{conversationId}/auto-save",
        summary: "Auto-save draft progress",
        description: "Save the current state of the listing draft including current step and extracted data.",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "current_step", type: "string", nullable: true),
                    new OA\Property(property: "data", type: "object", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Draft saved successfully"),
            new OA\Response(response: 404, description: "Conversation not found"),
        ]
    )]
    public function autoSave(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        // Update current step if provided
        if ($request->has('current_step')) {
            $conversation->current_step = $request->input('current_step');
        }

        // Update extracted data if provided
        if ($request->has('data')) {
            $newData = $request->input('data', []);
            $conversation->updateExtractedData($newData);
        }

        $conversation->save();

        return response()->json([
            'success' => true,
            'conversation_id' => $conversation->conversation_id,
            'current_step' => $conversation->current_step,
            'extracted_data' => $conversation->extracted_data,
        ]);
    }

    /**
     * Update map coordinates
     */
    #[OA\Post(
        path: "/listing/assistant/{conversationId}/map-coordinates",
        summary: "Save map coordinates",
        description: "Save the latitude and longitude coordinates from the map pin.",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["latitude", "longitude"],
                properties: [
                    new OA\Property(property: "latitude", type: "number"),
                    new OA\Property(property: "longitude", type: "number"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Coordinates saved successfully"),
            new OA\Response(response: 404, description: "Conversation not found"),
        ]
    )]
    public function saveMapCoordinates(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $conversation->updateExtractedData([
            'latitude' => (string) $request->input('latitude'),
            'longitude' => (string) $request->input('longitude'),
        ]);

        return response()->json([
            'success' => true,
            'latitude' => $conversation->extracted_data['latitude'] ?? null,
            'longitude' => $conversation->extracted_data['longitude'] ?? null,
        ]);
    }

    /**
     * Update a specific field via button selection
     */
    #[OA\Post(
        path: "/listing/assistant/{conversationId}/set-field",
        summary: "Set field value via button",
        description: "Set a specific field value when user clicks a button choice (e.g., property type, bedrooms).",
        tags: ["Listing Assistant"],
        parameters: [
            new OA\Parameter(
                name: "conversationId",
                in: "path",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["field", "value"],
                properties: [
                    new OA\Property(property: "field", type: "string"),
                    new OA\Property(property: "value", type: "string"),
                    new OA\Property(property: "next_step", type: "string", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Field updated successfully"),
            new OA\Response(response: 404, description: "Conversation not found"),
        ]
    )]
    public function setField(Request $request, string $conversationId): JsonResponse
    {
        $conversation = ListingAssistantConversation::where('conversation_id', $conversationId)->first();

        if (!$conversation) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        $request->validate([
            'field' => 'required|string',
            'value' => 'required',
            'next_step' => 'nullable|string',
        ]);

        $field = $request->input('field');
        $value = $request->input('value');
        $nextStep = $request->input('next_step');

        // Convert numeric strings to integers for bedrooms, bathrooms, etc.
        if (in_array($field, ['bedrooms', 'bathrooms', 'parking_slots', 'area_sqm', 'lot_area_sqm', 'property_age', 'floor_level'])) {
            $value = (int) $value;
        }

        // Convert price to number
        if ($field === 'price') {
            $value = (float) $value;
        }

        $conversation->updateExtractedData([$field => $value]);

        // Update current step if provided
        if ($nextStep) {
            $conversation->current_step = $nextStep;
        }

        $conversation->save();

        // Generate AI response for this field update
        $fieldLabels = [
            'property_name' => 'Property Name',
            'property_type' => 'Property Type',
            'location' => 'Location',
            'price' => 'Price',
            'bedrooms' => 'Bedrooms',
            'bathrooms' => 'Bathrooms',
        ];

        $fieldLabel = $fieldLabels[$field] ?? $field;
        $aiResponse = "✓ {$fieldLabel} set to: {$value}";

        $conversation->addMessage('assistant', $aiResponse);

        $missingFields = $this->listingAssistantService->identifyMissingFields(
            $conversation->extracted_data ?? [],
            $conversation->skipped_fields ?? []
        );

        return response()->json([
            'success' => true,
            'field' => $field,
            'value' => $value,
            'current_step' => $conversation->current_step,
            'extracted_data' => $conversation->extracted_data,
            'missing_fields' => $missingFields,
            'form_ready' => $conversation->isFormReady(),
            'ai_response' => $aiResponse,
        ]);
    }
}
