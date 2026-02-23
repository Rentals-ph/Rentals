<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AgentApproval;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
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
     * Get all pending agents awaiting approval.
     */
    #[OA\Get(
        path: "/admin/agents/pending",
        summary: "Get all pending agents",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Pending agents retrieved successfully",
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
                                    new OA\Property(property: "email", type: "string", example: "john@example.com"),
                                    new OA\Property(property: "agency_name", type: "string", example: "ABC Realty"),
                                    new OA\Property(property: "prc_license_number", type: "string", example: "PRC-12345"),
                                    new OA\Property(property: "status", type: "string", example: "pending"),
                                    new OA\Property(property: "created_at", type: "string", format: "date-time"),
                                ]
                            )
                        ),
                    ]
                )
            ),
        ]
    )]
    public function getPendingAgents(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $pendingAgents = User::where('role', 'agent')
            ->where('status', 'pending')
            ->select([
                'id',
                'first_name',
                'last_name',
                'email',
                'agency_name',
                'prc_license_number',
                'license_type',
                'status',
                'created_at',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pendingAgents,
        ]);
    }

    /**
     * Get a specific agent's details for review.
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
            ->with('latestApproval.approvedBy')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $agent,
        ]);
    }

    /**
     * Approve an agent.
     */
    #[OA\Post(
        path: "/admin/agents/{id}/approve",
        summary: "Approve an agent",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "notes", type: "string", nullable: true, description: "Optional notes about the approval"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Agent approved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Agent approved successfully"),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "Agent not found",
            ),
            new OA\Response(
                response: 422,
                description: "Validation error or agent already processed",
            ),
        ]
    )]
    public function approveAgent(Request $request, int $id): JsonResponse
    {
        $admin = $this->ensureAdmin($request);

        // Check if admin has permission
        if (!$admin->canApproveAgents()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to approve agents.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $agent = User::where('role', 'agent')->findOrFail($id);

        // Check if agent is already processed
        if ($agent->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Agent is already {$agent->status}. Cannot approve again.",
            ], 422);
        }

        // Update agent status
        $agent->status = 'approved';
        $agent->verified = true;
        $agent->save();

        // Create approval record
        AgentApproval::create([
            'user_id' => $agent->id,
            'approved_by_user_id' => $admin->id,
            'action' => 'approved',
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Agent approved successfully',
            'data' => [
                'agent' => $agent->fresh(['latestApproval.approvedBy']),
            ],
        ]);
    }

    /**
     * Reject an agent.
     */
    #[OA\Post(
        path: "/admin/agents/{id}/reject",
        summary: "Reject an agent",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["notes"],
                    properties: [
                        new OA\Property(property: "notes", type: "string", description: "Reason for rejection"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Agent rejected successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Agent rejected successfully"),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: "Agent not found",
            ),
            new OA\Response(
                response: 422,
                description: "Validation error or agent already processed",
            ),
        ]
    )]
    public function rejectAgent(Request $request, int $id): JsonResponse
    {
        $admin = $this->ensureAdmin($request);

        // Check if admin has permission
        if (!$admin->canApproveAgents()) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to reject agents.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'notes' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $agent = User::where('role', 'agent')->findOrFail($id);

        // Check if agent is already processed
        if ($agent->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Agent is already {$agent->status}. Cannot reject again.",
            ], 422);
        }

        // Update agent status
        $agent->status = 'rejected';
        $agent->save();

        // Create rejection record
        AgentApproval::create([
            'user_id' => $agent->id,
            'approved_by_user_id' => $admin->id,
            'action' => 'rejected',
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Agent rejected successfully',
            'data' => [
                'agent' => $agent->fresh(['latestApproval.approvedBy']),
            ],
        ]);
    }

    /**
     * Get all agents with their approval status.
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
            ->with('latestApproval.approvedBy');

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
}

