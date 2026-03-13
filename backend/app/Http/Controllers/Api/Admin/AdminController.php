<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class AdminController extends Controller
{
    /**
     * Ensure the authenticated user is an Admin.
     */
    protected function ensureAdmin(Request $request): User
    {
        $user = $request->user();
        
        if (!$user->isAdmin()) {
            abort(403, 'Access denied. Admin authentication required.');
        }

        if (!$user->is_active) {
            abort(403, 'Your admin account is inactive.');
        }

        return $user;
    }

    /**
     * Login admin and return access token.
     */
    #[OA\Post(
        path: "/admin/login",
        summary: "Login admin",
        tags: ["Admin"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["email", "password"],
                    properties: [
                        new OA\Property(property: "email", type: "string", format: "email", description: "Admin's email address"),
                        new OA\Property(property: "password", type: "string", description: "Admin's password"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Login successful",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Login successful"),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "token", type: "string", example: "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"),
                                new OA\Property(property: "token_type", type: "string", example: "Bearer"),
                                new OA\Property(property: "admin", type: "object"),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 401,
                description: "Invalid credentials or inactive account",
            ),
        ]
    )]
    public function login(Request $request): JsonResponse
    {
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

        $admin = User::where('email', $request->email)
            ->whereIn('role', ['admin', 'super_admin', 'moderator'])
            ->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        if (!$admin->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is inactive. Please contact the administrator.',
            ], 401);
        }

        $token = $admin->createToken('admin-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'admin' => [
                    'id' => $admin->id,
                    'first_name' => $admin->first_name,
                    'last_name' => $admin->last_name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                ],
            ],
        ], 200);
    }

    /**
     * Get a specific agent's details.
     */
    #[OA\Get(
        path: "/admin/agents/{id}",
        summary: "Get agent details for review",
        tags: ["Admin"],
        security: [["sanctum" => []]],
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
            new OA\Response(
                response: 404,
                description: "Agent not found",
            ),
        ]
    )]
    public function getAgentDetails(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $agent = User::where('role', 'agent')
            ->with('company')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $agent,
        ]);
    }

    /**
     * Get all agents.
     */
    #[OA\Get(
        path: "/admin/agents",
        summary: "Get all agents",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Agents retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
        ]
    )]
    public function getAllAgents(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $status = $request->query('status'); // Optional filter by status

        $query = User::where('role', 'agent')
            ->with('company');

        if ($status) {
            $query->where('status', $status);
        }

        $agents = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $agents,
        ]);
    }

    /**
     * Get all users (with optional filtering).
     */
    #[OA\Get(
        path: "/admin/users",
        summary: "Get all users",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Users retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
        ]
    )]
    public function getAllUsers(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $role = $request->query('role'); // Optional filter by role
        $status = $request->query('status'); // Optional filter by status

        $query = User::query();

        if ($role) {
            $query->where('role', $role);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Get a specific user's details.
     */
    #[OA\Get(
        path: "/admin/users/{id}",
        summary: "Get user details",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "User details retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "User not found",
            ),
        ]
    )]
    public function getUserDetails(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $user = User::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Create a new user.
     */
    #[OA\Post(
        path: "/admin/users",
        summary: "Create a new user",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["first_name", "last_name", "email", "password", "role"],
                    properties: [
                        new OA\Property(property: "first_name", type: "string"),
                        new OA\Property(property: "last_name", type: "string"),
                        new OA\Property(property: "email", type: "string", format: "email"),
                        new OA\Property(property: "password", type: "string", minLength: 8),
                        new OA\Property(property: "role", type: "string", enum: ["agent", "admin", "renter"]),
                        new OA\Property(property: "phone", type: "string", nullable: true),
                        new OA\Property(property: "status", type: "string", enum: ["pending", "approved", "rejected", "active", "inactive", "suspended"], nullable: true),
                        new OA\Property(property: "is_active", type: "boolean", nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "User created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
            ),
        ]
    )]
    public function createUser(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:agent,admin,renter',
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|string|in:pending,approved,rejected,active,inactive,suspended',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => $request->password, // Will be auto-hashed by model cast
            'role' => $request->role,
            'phone' => $request->phone,
            'status' => $request->status ?? ($request->role === 'agent' ? 'pending' : 'active'),
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    /**
     * Update a user.
     */
    #[OA\Put(
        path: "/admin/users/{id}",
        summary: "Update a user",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "first_name", type: "string"),
                        new OA\Property(property: "last_name", type: "string"),
                        new OA\Property(property: "email", type: "string", format: "email"),
                        new OA\Property(property: "password", type: "string", minLength: 8),
                        new OA\Property(property: "role", type: "string", enum: ["agent", "admin", "renter"]),
                        new OA\Property(property: "phone", type: "string", nullable: true),
                        new OA\Property(property: "status", type: "string", enum: ["pending", "approved", "rejected", "active", "inactive", "suspended"]),
                        new OA\Property(property: "is_active", type: "boolean"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "User updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "User not found",
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
            ),
        ]
    )]
    public function updateUser(Request $request, int $id): JsonResponse
    {
        $this->ensureAdmin($request);

        $user = User::findOrFail($id);

        // Prevent updating your own role/status if you're the only super admin
        if ($user->id === $request->user()->id && $user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot modify your own super admin account.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|required|string|min:8',
            'role' => 'sometimes|required|string|in:agent,admin,renter',
            'phone' => 'nullable|string|max:20',
            'status' => 'sometimes|nullable|string|in:pending,approved,rejected,active,inactive,suspended',
            'is_active' => 'sometimes|nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $updateData = $request->only([
            'first_name',
            'last_name',
            'email',
            'role',
            'phone',
            'status',
            'is_active',
        ]);

        if ($request->has('password')) {
            $updateData['password'] = $request->password; // Will be auto-hashed
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Delete a user.
     */
    #[OA\Delete(
        path: "/admin/users/{id}",
        summary: "Delete a user",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "User deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string"),
                    ]
                )
            ),
            new OA\Response(
                response: 403,
                description: "Cannot delete this user",
            ),
            new OA\Response(
                response: 404,
                description: "User not found",
            ),
        ]
    )]
    public function deleteUser(Request $request, int $id): JsonResponse
    {
        $admin = $this->ensureAdmin($request);

        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === $admin->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        // Prevent deleting the last super admin
        if ($user->isSuperAdmin()) {
            $superAdminCount = User::where('role', 'super_admin')->count();
            if ($superAdminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete the last super admin.',
                ], 403);
            }
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Get all properties (admin only).
     */
    public function getAllProperties(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $status = $request->query('status');
        $draftStatus = $request->query('draft_status');
        $agentId = $request->query('agent_id');

        $query = Property::with('agent');

        if ($status) {
            $query->where('status', $status);
        }

        if ($draftStatus) {
            $query->where('draft_status', $draftStatus);
        }

        if ($agentId) {
            $query->where('agent_id', $agentId);
        }

        $properties = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $properties,
        ]);
    }

    /**
     * Get a specific property's details (admin only).
     */
    public function getPropertyDetails(Request $request, $identifier): JsonResponse
    {
        $this->ensureAdmin($request);

        $property = is_numeric($identifier)
            ? Property::with('agent')->findOrFail($identifier)
            : Property::with('agent')->where('slug', $identifier)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $property,
        ]);
    }

    /**
     * Create a new property (admin only).
     */
    public function createProperty(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|max:255',
            'listing_type' => 'nullable|string|in:for_rent,for_sale',
            'price' => 'nullable|numeric|min:0',
            'price_type' => 'nullable|string|in:monthly,yearly,per_sqm,total',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'garage' => 'nullable|integer|min:0',
            'area' => 'nullable|numeric|min:0',
            'lot_area' => 'nullable|numeric|min:0',
            'city' => 'nullable|string|max:255',
            'state_province' => 'nullable|string|max:255',
            'street_address' => 'nullable|string|max:255',
            'agent_id' => 'nullable|exists:users,id',
            'status' => 'nullable|string|in:available,rented,under_negotiation,unlisted',
            'draft_status' => 'nullable|string|in:draft,published',
            'is_featured' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $property = Property::create([
            'title' => $request->title,
            'description' => $request->description,
            'type' => $request->type,
            'listing_type' => $request->listing_type,
            'price' => $request->price,
            'price_type' => $request->price_type,
            'bedrooms' => $request->bedrooms,
            'bathrooms' => $request->bathrooms,
            'garage' => $request->garage,
            'area' => $request->area,
            'lot_area' => $request->lot_area,
            'city' => $request->city,
            'state_province' => $request->state_province,
            'street_address' => $request->street_address,
            'agent_id' => $request->agent_id,
            'status' => $request->status ?? 'available',
            'draft_status' => $request->draft_status ?? 'draft',
            'is_featured' => $request->is_featured ?? false,
        ]);

        $property->load('agent');

        return response()->json([
            'success' => true,
            'message' => 'Property created successfully',
            'data' => $property,
        ], 201);
    }

    /**
     * Update a property (admin only).
     */
    public function updateProperty(Request $request, $identifier): JsonResponse
    {
        $this->ensureAdmin($request);

        $property = is_numeric($identifier)
            ? Property::findOrFail($identifier)
            : Property::where('slug', $identifier)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'nullable|string|max:255',
            'listing_type' => 'nullable|string|in:for_rent,for_sale',
            'price' => 'nullable|numeric|min:0',
            'price_type' => 'nullable|string|in:monthly,yearly,per_sqm,total',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'garage' => 'nullable|integer|min:0',
            'area' => 'nullable|numeric|min:0',
            'lot_area' => 'nullable|numeric|min:0',
            'city' => 'nullable|string|max:255',
            'state_province' => 'nullable|string|max:255',
            'street_address' => 'nullable|string|max:255',
            'agent_id' => 'nullable|exists:users,id',
            'status' => 'nullable|string|in:available,rented,under_negotiation,unlisted',
            'draft_status' => 'nullable|string|in:draft,published',
            'is_featured' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $property->update($request->only([
            'title',
            'description',
            'type',
            'listing_type',
            'price',
            'price_type',
            'bedrooms',
            'bathrooms',
            'garage',
            'area',
            'lot_area',
            'city',
            'state_province',
            'street_address',
            'agent_id',
            'status',
            'draft_status',
            'is_featured',
        ]));

        $property->load('agent');

        return response()->json([
            'success' => true,
            'message' => 'Property updated successfully',
            'data' => $property->fresh(),
        ]);
    }

    /**
     * Delete a property (admin only).
     */
    public function deleteProperty(Request $request, $identifier): JsonResponse
    {
        $this->ensureAdmin($request);

        $property = is_numeric($identifier)
            ? Property::findOrFail($identifier)
            : Property::where('slug', $identifier)->firstOrFail();

        $property->delete();

        return response()->json([
            'success' => true,
            'message' => 'Property deleted successfully',
        ]);
    }
}

