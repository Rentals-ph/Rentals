<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactInquiry;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

class ContactController extends Controller
{
    /**
     * Submit a contact inquiry (public endpoint).
     */
    #[OA\Post(
        path: "/contact",
        summary: "Submit a contact inquiry",
        tags: ["Contact"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["name", "email", "subject", "message"],
                    properties: [
                        new OA\Property(property: "name", type: "string"),
                        new OA\Property(property: "email", type: "string", format: "email"),
                        new OA\Property(property: "phone", type: "string", nullable: true),
                        new OA\Property(property: "subject", type: "string"),
                        new OA\Property(property: "message", type: "string"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Contact inquiry submitted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Thank you for contacting us. We will get back to you soon."),
                        new OA\Property(property: "data", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function submit(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $inquiry = ContactInquiry::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'subject' => $request->subject,
            'message' => $request->message,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for contacting us. We will get back to you soon.',
            'data' => $inquiry,
        ], 201);
    }

    /**
     * Get all contact inquiries (admin only).
     */
    #[OA\Get(
        path: "/admin/contact-inquiries",
        summary: "Get all contact inquiries",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "is_read", in: "query", required: false, schema: new OA\Schema(type: "boolean")),
            new OA\Parameter(name: "page", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Contact inquiries retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Access denied. Admin authentication required.');
        }

        $query = ContactInquiry::with('readBy:id,first_name,last_name,email')
            ->orderBy('created_at', 'desc');

        // Filter by read status
        if ($request->has('is_read')) {
            $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
        }

        // Pagination
        if ($request->has('page') || $request->has('per_page')) {
            $perPage = $request->get('per_page', 15);
            $inquiries = $query->paginate($perPage);
        } else {
            $inquiries = $query->get();
        }

        return response()->json([
            'success' => true,
            'data' => $inquiries,
        ]);
    }

    /**
     * Get a specific contact inquiry (admin only).
     */
    #[OA\Get(
        path: "/admin/contact-inquiries/{id}",
        summary: "Get a specific contact inquiry",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Contact inquiry retrieved successfully",
            ),
            new OA\Response(response: 404, description: "Contact inquiry not found"),
        ]
    )]
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Access denied. Admin authentication required.');
        }

        $inquiry = ContactInquiry::with('readBy:id,first_name,last_name,email')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $inquiry,
        ]);
    }

    /**
     * Mark contact inquiry as read (admin only).
     */
    #[OA\Post(
        path: "/admin/contact-inquiries/{id}/read",
        summary: "Mark contact inquiry as read",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Contact inquiry marked as read",
            ),
            new OA\Response(response: 404, description: "Contact inquiry not found"),
        ]
    )]
    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Access denied. Admin authentication required.');
        }

        $inquiry = ContactInquiry::findOrFail($id);
        $inquiry->markAsRead($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Contact inquiry marked as read',
            'data' => $inquiry->fresh(),
        ]);
    }

    /**
     * Delete a contact inquiry (admin only).
     */
    #[OA\Delete(
        path: "/admin/contact-inquiries/{id}",
        summary: "Delete a contact inquiry",
        tags: ["Admin"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Contact inquiry deleted successfully",
            ),
            new OA\Response(response: 404, description: "Contact inquiry not found"),
        ]
    )]
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Access denied. Admin authentication required.');
        }

        $inquiry = ContactInquiry::findOrFail($id);
        $inquiry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contact inquiry deleted successfully',
        ]);
    }
}
