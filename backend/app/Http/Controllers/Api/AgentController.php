<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use OpenApi\Attributes as OA;

class AgentController extends Controller
{
    /**
     * Register a new agent.
     * NOTE: This endpoint is not currently routed. Use /register from AuthController instead.
     * Kept for potential future use or migration purposes.
     * 
     * @deprecated Use AuthController::register() instead. This method may be removed in a future version.
     */
    public function register(Request $request): JsonResponse
    {
        try {
            // Validate the request data
            $validator = Validator::make($request->all(), [
                // Personal Information
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => 'required|string|min:8',
                'phone' => 'nullable|string|max:20',
                'dateOfBirth' => 'nullable|date',
                
                // Agency Information
                'agencyName' => 'nullable|string|max:255',
                'officeAddress' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:255',
                'state' => 'nullable|string|max:255',
                'zipCode' => 'nullable|string|max:20',
                
                // PRC Certification
                'prcLicenseNumber' => 'required|string|max:255|unique:users,prc_license_number',
                'licenseType' => 'required|in:broker,salesperson',
                'expirationDate' => 'required|date|after:today',
                'yearsOfExperience' => 'nullable|string|max:50',
                'licenseDocument' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB max
                'agreeToTerms' => 'required|accepted',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Handle file upload
            $licenseDocumentPath = null;
            if ($request->hasFile('licenseDocument')) {
                $file = $request->file('licenseDocument');
                $fileName = time() . '_' . $file->getClientOriginalName();
                
                // Ensure the directory exists
                $directory = 'agents/licenses';
                if (!Storage::disk('public')->exists($directory)) {
                    Storage::disk('public')->makeDirectory($directory);
                }
                
                // Store in public/agents/licenses directory
                $licenseDocumentPath = $file->storeAs($directory, $fileName, 'public');
            }

            // Create the user (agent)
            // Note: Password is automatically hashed by the 'hashed' cast in the User model
            $userData = [
                'first_name' => $request->firstName,
                'last_name' => $request->lastName,
                'email' => $request->email,
                'password' => $request->password, // Will be automatically hashed by the model cast
                'phone' => $request->phone,
                'date_of_birth' => $request->dateOfBirth,
                'role' => 'agent',
                'agency_name' => $request->agencyName,
                'office_address' => $request->officeAddress,
                'city' => $request->city,
                'state' => $request->state,
                'zip_code' => $request->zipCode,
                'prc_license_number' => $request->prcLicenseNumber,
                'license_type' => $request->licenseType,
                'expiration_date' => $request->expirationDate,
                'years_of_experience' => $request->yearsOfExperience,
                'license_document_path' => $licenseDocumentPath,
                'status' => 'pending', // New agents start with pending status
                'verified' => false, // New agents are not verified by default
                'is_active' => true,
            ];
            
            // Add name field if the column exists (for backward compatibility before migration)
            if (Schema::hasColumn('users', 'name')) {
                $userData['name'] = $request->firstName . ' ' . $request->lastName;
            }
            
            $agent = User::create($userData);

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Agent registration successful! Your application is pending approval.',
                'data' => [
                    'id' => $agent->id,
                    'name' => $agent->full_name,
                    'email' => $agent->email,
                    'status' => $agent->status,
                ],
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            // Handle database errors specifically
            \Log::error('Agent registration database error: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'Database error occurred.';
            if (config('app.debug')) {
                $errorMessage = $e->getMessage();
                // Check for common database errors
                if (str_contains($e->getMessage(), "Base table or view not found")) {
                    $errorMessage = 'Database table not found. Please run: php artisan migrate';
                } elseif (str_contains($e->getMessage(), "Unknown column")) {
                    $errorMessage = 'Database column mismatch. Please check your migration.';
                } elseif (str_contains($e->getMessage(), "Connection refused") || str_contains($e->getMessage(), "Access denied")) {
                    $errorMessage = 'Database connection failed. Please check your database credentials in .env';
                }
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => $errorMessage,
                'debug_info' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'sql' => $e->getSql(),
                ] : null,
            ], 500);
            
        } catch (\Exception $e) {
            // Log the full error for debugging
            \Log::error('Agent registration error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'An internal server error occurred.';
            if (config('app.debug')) {
                $errorMessage = $e->getMessage();
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => $errorMessage,
                'debug_info' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'type' => get_class($e),
                ] : null,
            ], 500);
        }
    }

    /**
     * Login agent and return access token.
     * NOTE: This endpoint is not currently routed. Use /login from AuthController instead.
     * Kept for potential future use or migration purposes.
     * 
     * @deprecated Use AuthController::login() instead. This method may be removed in a future version.
     */
    public function login(Request $request): JsonResponse
    {
        try {
            // Validate the request data
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Find the user (agent) by email
            $agent = User::where('email', $request->email)
                ->where('role', 'agent')
                ->first();

            // Check if agent exists
            if (!$agent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password',
                ], 401);
            }

            // Check if password is correct
            // Handle both hashed and plain text passwords (for migration purposes)
            $passwordValid = false;
            if (Hash::check($request->password, $agent->password)) {
                $passwordValid = true;
            } elseif ($agent->password === $request->password) {
                // If password is stored as plain text, hash it now
                $agent->password = $request->password; // Will be auto-hashed by model cast
                $agent->save();
                $passwordValid = true;
            }

            if (!$passwordValid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password',
                ], 401);
            }

            // Allow login for all agents (including processing/pending)
            // Processing agents can access dashboard but listings won't be visible to users

            // Revoke all existing tokens (optional - for security)
            // $agent->tokens()->delete();

            // Create a new token
            $token = $agent->createToken('auth-token')->plainTextToken;

            // Return success response with token and user status
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'user' => [
                        'id' => $agent->id,
                        'name' => $agent->first_name . ' ' . $agent->last_name,
                        'email' => $agent->email,
                        'status' => $agent->status ?? 'pending',
                    ],
                    'agent' => [
                        'id' => $agent->id,
                        'first_name' => $agent->first_name,
                        'last_name' => $agent->last_name,
                        'email' => $agent->email,
                        'phone' => $agent->phone,
                        'agency_name' => $agent->agency_name,
                        'prc_license_number' => $agent->prc_license_number,
                        'license_type' => $agent->license_type,
                        'status' => $agent->status ?? 'pending',
                        'verified' => $agent->verified ?? false,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            // Log the error
            \Log::error('Agent login error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $errorMessage = 'An internal server error occurred.';
            if (config('app.debug')) {
                $errorMessage = $e->getMessage();
            }

            return response()->json([
                'success' => false,
                'message' => 'Login failed. Please try again.',
                'error' => $errorMessage,
            ], 500);
        }
    }

    /**
     * Get all approved agents (public endpoint).
     */
    #[OA\Get(
        path: "/agents",
        summary: "Get all approved agents",
        tags: ["Agents"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Approved agents retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "data",
                            type: "array",
                            items: new OA\Items(
                                type: "object",
                                properties: [
                                    new OA\Property(property: "id", type: "integer", example: 1),
                                    new OA\Property(property: "first_name", type: "string", example: "John"),
                                    new OA\Property(property: "last_name", type: "string", example: "Doe"),
                                    new OA\Property(property: "full_name", type: "string", example: "John Doe"),
                                    new OA\Property(property: "email", type: "string", example: "john@example.com"),
                                    new OA\Property(property: "phone", type: "string", nullable: true, example: "+1234567890"),
                                    new OA\Property(property: "agency_name", type: "string", nullable: true, example: "ABC Realty"),
                                    new OA\Property(property: "city", type: "string", nullable: true, example: "Manila"),
                                    new OA\Property(property: "state", type: "string", nullable: true, example: "Metro Manila"),
                                    new OA\Property(property: "properties_count", type: "integer", example: 5),
                                ]
                            )
                        ),
                    ]
                )
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        try {
            // Get all approved and active agents
            $agents = User::where('role', 'agent')
                ->where('status', 'approved')
                ->where('is_active', true)
                ->withCount('properties')
                ->select([
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'phone',
                    'whatsapp',
                    'agency_name',
                    'city',
                    'state',
                    'image_path',
                ])
                ->orderBy('first_name')
                ->get()
                ->map(function ($agent) {
                    $imageUrl = null;
                    if ($agent->image_path) {
                        try {
                            $imageUrl = \App\Services\ImageService::url($agent->image_path);
                        } catch (\Exception $e) {
                            \Log::warning('Error generating image URL for agent ' . $agent->id . ': ' . $e->getMessage());
                            $imageUrl = null;
                        }
                    }
                    
                    return [
                        'id' => $agent->id,
                        'first_name' => $agent->first_name,
                        'last_name' => $agent->last_name,
                        'full_name' => $agent->full_name,
                        'email' => $agent->email,
                        'phone' => $agent->phone,
                        'whatsapp' => $agent->whatsapp,
                        'agency_name' => $agent->agency_name,
                        'city' => $agent->city,
                        'state' => $agent->state,
                        'properties_count' => $agent->properties_count ?? 0,
                        'image' => $imageUrl,
                        'image_path' => $agent->image_path,
                        'profile_image' => $imageUrl,
                        'avatar' => $imageUrl,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $agents,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error in AgentController::index: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'Database error occurred while fetching agents.';
            if (config('app.debug')) {
                $errorMessage = $e->getMessage();
                // Check for common database errors
                if (str_contains($e->getMessage(), "Base table or view not found")) {
                    $errorMessage = 'Database table not found. Please run: php artisan migrate';
                } elseif (str_contains($e->getMessage(), "Unknown column")) {
                    $errorMessage = 'Database column mismatch. Please check your migration.';
                } elseif (str_contains($e->getMessage(), "Connection refused") || str_contains($e->getMessage(), "Access denied")) {
                    $errorMessage = 'Database connection failed. Please check your database credentials in .env';
                }
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch agents.',
                'error' => $errorMessage,
                'debug_info' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'sql' => $e->getSql(),
                ] : null,
            ], 500);
        } catch (\Exception $e) {
            \Log::error('Error in AgentController::index: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'An internal server error occurred while fetching agents.';
            if (config('app.debug')) {
                $errorMessage = $e->getMessage();
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch agents.',
                'error' => $errorMessage,
                'debug_info' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'type' => get_class($e),
                ] : null,
            ], 500);
        }
    }

    /**
     * Get agent details (for authenticated agents).
     */
    #[OA\Get(
        path: "/agents/me",
        summary: "Get authenticated agent details",
        tags: ["Agents"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Agent details retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "first_name", type: "string", example: "John"),
                                new OA\Property(property: "last_name", type: "string", example: "Doe"),
                                new OA\Property(property: "email", type: "string", example: "john@example.com"),
                                new OA\Property(property: "phone", type: "string", nullable: true, example: "+1234567890"),
                                new OA\Property(property: "agency_name", type: "string", nullable: true, example: "ABC Realty"),
                                new OA\Property(property: "prc_license_number", type: "string", example: "PRC-12345"),
                                new OA\Property(property: "license_type", type: "string", example: "broker"),
                                new OA\Property(property: "status", type: "string", example: "approved"),
                                new OA\Property(property: "verified", type: "boolean", example: true),
                            ]
                        ),
                    ]
                )
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
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Ensure user is an agent
        if (!$user->isAgent()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Agent authentication required.',
            ], 403);
        }
        
        // Get image URL if image_path exists
        $imageUrl = null;
        if ($user->image_path) {
            $imageUrl = \App\Services\ImageService::url($user->image_path);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'agency_name' => $user->agency_name,
                'prc_license_number' => $user->prc_license_number,
                'license_type' => $user->license_type,
                'status' => $user->status,
                'verified' => $user->verified,
                'image' => $imageUrl,
                'image_path' => $user->image_path,
                'profile_image' => $imageUrl,
                'avatar' => $imageUrl,
                'city' => $user->city,
                'state' => $user->state,
                'office_address' => $user->office_address,
            ],
        ]);
    }

    /**
     * Get agent by ID (public endpoint for approved agents).
     */
    #[OA\Get(
        path: "/agents/{id}",
        summary: "Get agent by ID",
        tags: ["Agents"],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "Agent ID",
                schema: new OA\Schema(type: "integer")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Agent details retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
        ]
    )]
    public function getById($id): JsonResponse
    {
        $agent = User::where('role', 'agent')
            ->where('id', $id)
            ->where('status', 'approved')
            ->where('is_active', true)
            ->first();
        
        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent not found',
            ], 404);
        }
        
        $imageUrl = null;
        if ($agent->image_path) {
            $imageUrl = \App\Services\ImageService::url($agent->image_path);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $agent->id,
                'first_name' => $agent->first_name,
                'last_name' => $agent->last_name,
                'full_name' => $agent->full_name,
                'email' => $agent->email,
                'phone' => $agent->phone,
                'agency_name' => $agent->agency_name,
                'city' => $agent->city,
                'state' => $agent->state,
                'image' => $imageUrl,
                'image_path' => $agent->image_path,
                'profile_image' => $imageUrl,
                'avatar' => $imageUrl,
                'properties_count' => $agent->properties()->count(),
            ],
        ]);
    }

    /**
     * Get agent dashboard statistics.
     */
    #[OA\Get(
        path: "/agents/dashboard/stats",
        summary: "Get agent dashboard statistics",
        tags: ["Agents"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Dashboard statistics retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "total_listings", type: "integer", example: 24),
                                new OA\Property(property: "active_listings", type: "integer", example: 18),
                                new OA\Property(property: "total_revenue", type: "number", example: 145000),
                                new OA\Property(property: "unread_messages", type: "integer", example: 3),
                            ]
                        ),
                    ]
                )
            ),
        ]
    )]
    public function dashboardStats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Ensure user is an agent
        if (!$user->isAgent()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Agent authentication required.',
            ], 403);
        }
        
        // Get total listings count
        $totalListings = $user->properties()->count();
        
        // Get active listings (published)
        $activeListings = $user->properties()->whereNotNull('published_at')->count();
        
        // Calculate total revenue (sum of all property prices)
        // Note: This is a simple calculation. In a real app, you'd track actual rental income
        $totalRevenue = $user->properties()
            ->whereNotNull('published_at')
            ->sum('price');
        
        // For now, unread messages is set to 0 (would need a messages table)
        $unreadMessages = 0;
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_listings' => $totalListings,
                'active_listings' => $activeListings,
                'total_revenue' => $totalRevenue,
                'unread_messages' => $unreadMessages,
            ],
        ]);
    }

    /**
     * Update agent profile.
     */
    #[OA\Put(
        path: "/agents/me",
        summary: "Update authenticated agent profile",
        tags: ["Agents"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "first_name", type: "string"),
                        new OA\Property(property: "last_name", type: "string"),
                        new OA\Property(property: "phone", type: "string"),
                        new OA\Property(property: "city", type: "string"),
                        new OA\Property(property: "state", type: "string"),
                        new OA\Property(property: "office_address", type: "string"),
                        new OA\Property(property: "image", type: "string", format: "binary", nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Profile updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
        ]
    )]
    public function update(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Ensure user is an agent
            if (!$user->isAgent()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Agent authentication required.',
                ], 403);
            }
            
            $validated = $request->validate([
                'first_name' => 'sometimes|nullable|string|max:255',
                'last_name' => 'sometimes|nullable|string|max:255',
                'phone' => 'sometimes|nullable|string|max:20',
                'city' => 'sometimes|nullable|string|max:255',
                'state' => 'sometimes|nullable|string|max:255',
                'office_address' => 'sometimes|nullable|string|max:500',
                'image' => 'sometimes|image|mimes:jpeg,jpg,png,gif,webp|max:2048',
            ]);
            
            // Handle image upload
            if ($request->hasFile('image')) {
                try {
                    $file = $request->file('image');
                    
                    \Log::info('Image file received for user ' . $user->id, [
                        'filename' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'mime' => $file->getMimeType(),
                        'isValid' => $file->isValid(),
                    ]);
                    
                    // Validate file
                    if (!$file->isValid()) {
                        \Log::warning('Invalid image file uploaded for user ' . $user->id);
                    } else {
                        // Delete old image if exists
                        if ($user->image_path) {
                            \App\Services\ImageService::delete($user->image_path);
                        }
                        
                        // Upload new image - use users directory structure with avatar.jpg filename
                        $directory = 'images/users/' . $user->id;
                        $extension = $file->getClientOriginalExtension();
                        
                        // Fallback to jpg if extension is missing
                        if (empty($extension)) {
                            $mimeType = $file->getMimeType();
                            if (strpos($mimeType, 'jpeg') !== false || strpos($mimeType, 'jpg') !== false) {
                                $extension = 'jpg';
                            } elseif (strpos($mimeType, 'png') !== false) {
                                $extension = 'png';
                            } elseif (strpos($mimeType, 'gif') !== false) {
                                $extension = 'gif';
                            } elseif (strpos($mimeType, 'webp') !== false) {
                                $extension = 'webp';
                            } else {
                                $extension = 'jpg'; // Default fallback
                            }
                        }
                        
                        $filename = 'avatar.' . strtolower($extension);
                        
                        // Store the file with the specific filename
                        $imagePath = $file->storeAs($directory, $filename, 'public');
                        
                        if ($imagePath) {
                            $validated['image_path'] = $imagePath;
                            \Log::info('Image uploaded successfully for user ' . $user->id . ': ' . $imagePath);
                        } else {
                            \Log::error('Failed to store image for user ' . $user->id . ' - storeAs returned false');
                        }
                    }
                } catch (\Exception $e) {
                    \Log::error('Error uploading image for user ' . $user->id . ': ' . $e->getMessage(), [
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            } else {
                \Log::info('No image file in request for user ' . $user->id, [
                    'hasFile' => $request->hasFile('image'),
                    'allFiles' => array_keys($request->allFiles()),
                ]);
            }
            
            // Convert empty strings to null for optional fields (similar to property controller)
            $optionalFields = ['first_name', 'last_name', 'phone', 'city', 'state', 'office_address'];
            foreach ($optionalFields as $field) {
                if (isset($validated[$field]) && $validated[$field] === '') {
                    $validated[$field] = null;
                }
            }
            
            // Prepare update data - include all validated fields
            $updateData = [];
            
            // Always include image_path if it was set
            if (isset($validated['image_path']) && $validated['image_path'] !== null) {
                $updateData['image_path'] = $validated['image_path'];
            }
            
            // Process other fields - include all fields that were validated
            foreach ($validated as $key => $value) {
                // Skip image (file, not a database field)
                if ($key === 'image') {
                    continue;
                }
                
                // Include the field if it was in the request (even if null)
                if ($request->has($key) || isset($validated[$key])) {
                    $updateData[$key] = $value;
                }
            }
            
            \Log::info('Update data for user ' . $user->id . ':', $updateData);
            
            // Update user with all data
            if (!empty($updateData)) {
                $user->update($updateData);
                // Refresh the model to get updated values
                $user->refresh();
                \Log::info('User updated. New image_path: ' . ($user->image_path ?? 'null'));
            } else {
                \Log::warning('No update data for user ' . $user->id);
            }
            
            // Get image URL if image_path exists
            $imageUrl = null;
            if ($user->image_path) {
                try {
                    $imageUrl = \App\Services\ImageService::url($user->image_path);
                } catch (\Exception $e) {
                    \Log::warning('Error generating image URL for user ' . $user->id . ': ' . $e->getMessage());
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'agency_name' => $user->agency_name,
                    'city' => $user->city,
                    'state' => $user->state,
                    'office_address' => $user->office_address,
                    'image' => $imageUrl,
                    'image_path' => $user->image_path,
                    'profile_image' => $imageUrl,
                    'avatar' => $imageUrl,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating agent profile: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating your profile',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }
}

