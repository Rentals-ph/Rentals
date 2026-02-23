<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

class MessageController extends Controller
{
    /**
     * Send a message to an agent/broker.
     */
    #[OA\Post(
        path: "/messages",
        summary: "Send a message",
        tags: ["Messages"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["recipient_id", "sender_name", "sender_email", "message"],
                    properties: [
                        new OA\Property(property: "recipient_id", type: "integer", description: "Agent or Broker ID"),
                        new OA\Property(property: "property_id", type: "integer", nullable: true, description: "Property ID if this is a property inquiry"),
                        new OA\Property(property: "sender_name", type: "string"),
                        new OA\Property(property: "sender_email", type: "string"),
                        new OA\Property(property: "sender_phone", type: "string", nullable: true),
                        new OA\Property(property: "subject", type: "string", nullable: true),
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "type", type: "string", enum: ["contact", "property_inquiry", "general"], default: "general"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Message sent successfully"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'recipient_id' => 'required|integer|exists:users,id',
                'property_id' => 'nullable|integer|exists:properties,id',
                'sender_name' => 'required|string|max:255',
                'sender_email' => 'required|email|max:255',
                'sender_phone' => 'nullable|string|max:20',
                'subject' => 'nullable|string|max:255',
                'message' => 'required|string',
                'type' => 'nullable|string|in:contact,property_inquiry,general',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Verify recipient is an agent or broker
            $recipient = User::findOrFail($request->recipient_id);
            if (!$recipient->isAgent() && !$recipient->isBroker()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Recipient must be an agent or broker',
                ], 422);
            }

            // If property_id is provided, verify it belongs to the recipient
            if ($request->property_id) {
                $property = Property::findOrFail($request->property_id);
                if ($property->agent_id !== $recipient->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Property does not belong to the recipient',
                    ], 422);
                }
            }

            $message = Message::create([
                'sender_id' => $request->user()?->id, // If user is logged in
                'recipient_id' => $request->recipient_id,
                'property_id' => $request->property_id,
                'sender_name' => $request->sender_name,
                'sender_email' => $request->sender_email,
                'sender_phone' => $request->sender_phone,
                'subject' => $request->subject,
                'message' => $request->message,
                'type' => $request->type ?? ($request->property_id ? 'property_inquiry' : 'contact'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => $message,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error sending message: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send message',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get messages for authenticated agent/broker.
     */
    #[OA\Get(
        path: "/messages",
        summary: "Get messages for authenticated user",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["contact", "property_inquiry", "general"])),
            new OA\Parameter(name: "is_read", in: "query", required: false, schema: new OA\Schema(type: "boolean")),
            new OA\Parameter(name: "property_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Messages retrieved successfully"),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user || (!$user->isAgent() && !$user->isBroker())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Agent or Broker authentication required.',
                ], 403);
            }

            $query = Message::where('recipient_id', $user->id)
                ->with(['property', 'sender'])
                ->orderBy('created_at', 'desc');

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filter by read status
            if ($request->has('is_read')) {
                $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
            }

            // Filter by property
            if ($request->has('property_id')) {
                $query->where('property_id', $request->property_id);
            }

            $messages = $query->get();

            return response()->json([
                'success' => true,
                'data' => $messages,
                'unread_count' => Message::where('recipient_id', $user->id)->where('is_read', false)->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching messages: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch messages',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Mark message as read.
     */
    #[OA\Put(
        path: "/messages/{id}/read",
        summary: "Mark message as read",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Message marked as read"),
            new OA\Response(response: 404, description: "Message not found"),
        ]
    )]
    public function markAsRead(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $message = Message::where('id', $id)
                ->where('recipient_id', $user->id)
                ->firstOrFail();

            $message->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Message marked as read',
                'data' => $message,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error marking message as read: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark message as read',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get message by ID.
     */
    #[OA\Get(
        path: "/messages/{id}",
        summary: "Get message by ID",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Message retrieved successfully"),
            new OA\Response(response: 404, description: "Message not found"),
        ]
    )]
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $message = Message::where('id', $id)
                ->where('recipient_id', $user->id)
                ->with(['property', 'sender'])
                ->firstOrFail();

            // Mark as read when viewing
            $message->markAsRead();

            return response()->json([
                'success' => true,
                'data' => $message,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching message: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch message',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Delete a message.
     */
    #[OA\Delete(
        path: "/messages/{id}",
        summary: "Delete a message",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Message deleted successfully"),
            new OA\Response(response: 404, description: "Message not found"),
        ]
    )]
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

            $message = Message::where('id', $id)
                ->where('recipient_id', $user->id)
                ->firstOrFail();

            $message->delete();

            return response()->json([
                'success' => true,
                'message' => 'Message deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting message: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete message',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }
}

