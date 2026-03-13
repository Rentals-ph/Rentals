<?php

namespace App\Http\Controllers\Api\Shared;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\InquiryConversation;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;
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
                'type' => 'nullable|string|in:contact,property_inquiry,general,team_invitation,broker_invitation',
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

            // Find or create conversation
            $recipient = User::findOrFail($request->recipient_id);
            
            // Build query to find existing conversation (handling NULL values properly)
            $conversationQuery = InquiryConversation::where('customer_email', $request->sender_email)
                ->where(function($q) use ($request) {
                    if ($request->property_id) {
                        $q->where('property_id', $request->property_id);
                    } else {
                        $q->whereNull('property_id');
                    }
                });
            
            if ($recipient->isAgent()) {
                $conversationQuery->where('agent_id', $request->recipient_id)->whereNull('broker_id');
            } elseif ($recipient->isBroker()) {
                $conversationQuery->where('broker_id', $request->recipient_id)->whereNull('agent_id');
            }
            
            $conversation = $conversationQuery->first();
            
            if (!$conversation) {
                $conversation = InquiryConversation::create([
                    'customer_email' => $request->sender_email,
                    'customer_name' => $request->sender_name,
                    'agent_id' => $recipient->isAgent() ? $request->recipient_id : null,
                    'broker_id' => $recipient->isBroker() ? $request->recipient_id : null,
                    'property_id' => $request->property_id,
                    'type' => $request->type ?? ($request->property_id ? 'property_inquiry' : 'contact'),
                    'subject' => $request->subject,
                    'last_message_at' => now(),
                ]);
            } else {
                // Update conversation metadata
                $conversation->update([
                    'last_message_at' => now(),
                    'subject' => $request->subject ?? $conversation->subject,
                    'customer_name' => $request->sender_name, // Update name in case it changed
                ]);
            }

            $message = Message::create([
                'sender_id' => $request->user()?->id, // If user is logged in
                'recipient_id' => $request->recipient_id,
                'conversation_id' => $conversation->id,
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
                'data' => $message->load('conversation'),
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

            // Get conversations where user is the agent/broker
            $conversationsQuery = InquiryConversation::where(function($q) use ($user) {
                if ($user->isAgent()) {
                    $q->where('agent_id', $user->id);
                } elseif ($user->isBroker()) {
                    $q->where('broker_id', $user->id);
                }
            });

            // Apply type filter to conversations if needed
            if ($request->has('type')) {
                $conversationsQuery->where('type', $request->type);
            }

            // Get conversation IDs
            $conversationIds = $conversationsQuery->pluck('id');

            // Get messages from these conversations (only if there are conversations)
            // Exclude messages where the user is the sender (their own messages)
            $messages = collect([]);
            if ($conversationIds->isNotEmpty()) {
                $query = Message::whereIn('conversation_id', $conversationIds)
                    ->where('sender_id', '!=', $user->id) // Exclude messages sent by the user
                    ->with(['property', 'sender', 'conversation'])
                    ->orderBy('created_at', 'desc');

                // Filter by read status
                if ($request->has('is_read')) {
                    $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
                }

                // Filter by property
                if ($request->has('property_id')) {
                    $query->where('property_id', $request->property_id);
                }

                $messages = $query->get();
            }

            // Get conversations with latest message
            $conversations = $conversationsQuery
                ->with(['latestMessage', 'property'])
                ->orderBy('last_message_at', 'desc')
                ->get();

            // Calculate unread count (messages where agent/broker is recipient and not read)
            // Exclude messages where the user is the sender (their own messages)
            $unreadCount = 0;
            if ($conversationIds->isNotEmpty()) {
                $unreadCount = Message::whereIn('conversation_id', $conversationIds)
                    ->where('recipient_id', $user->id)
                    ->where('sender_id', '!=', $user->id) // Exclude own messages
                    ->where('is_read', false)
                    ->count();
            }

            return response()->json([
                'success' => true,
                'data' => $messages,
                'conversations' => $conversations,
                'unread_count' => $unreadCount,
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

            $message = Message::with('conversation')->find($id);
            
            if (!$message) {
                return response()->json([
                    'success' => false,
                    'message' => 'Message not found',
                ], 404);
            }

            // Check if user has access to this message
            $hasAccess = false;
            
            // Check if user is the recipient
            if ($message->recipient_id && (int)$message->recipient_id === (int)$user->id) {
                $hasAccess = true;
            }
            
            // If message is part of a conversation, check conversation access
            if (!$hasAccess && $message->conversation_id && $message->conversation) {
                $conversation = $message->conversation;
                
                // Check if user is the agent/broker for this conversation
                if ($user->isAgent() && $conversation->agent_id && (int)$conversation->agent_id === (int)$user->id) {
                    $hasAccess = true;
                } elseif ($user->isBroker() && $conversation->broker_id && (int)$conversation->broker_id === (int)$user->id) {
                    $hasAccess = true;
                }
            }

            if (!$hasAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to message',
                ], 403);
            }

            $message->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Message marked as read',
                'data' => $message,
            ]);
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
     * Mark all messages as read for authenticated user.
     */
    #[OA\Put(
        path: "/messages/read-all",
        summary: "Mark all messages as read",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "All messages marked as read"),
        ]
    )]
    public function markAllAsRead(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $count = Message::where('recipient_id', $user->id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => $count . ' message(s) marked as read',
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking all messages as read: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all messages as read',
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

    /**
     * Get customer inquiries by email (public endpoint).
     */
    #[OA\Get(
        path: "/messages/customer/{email}",
        summary: "Get customer inquiries by email",
        tags: ["Messages"],
        parameters: [
            new OA\Parameter(name: "email", in: "path", required: true, schema: new OA\Schema(type: "string")),
        ],
        responses: [
            new OA\Response(response: 200, description: "Customer inquiries retrieved successfully"),
        ]
    )]
    public function getCustomerInquiries(Request $request, $email): JsonResponse
    {
        try {
            // Get all conversations for this customer
            $conversations = InquiryConversation::where('customer_email', $email)
                ->with(['property', 'agent', 'broker', 'latestMessage'])
                ->orderBy('last_message_at', 'desc')
                ->get();

            // Get all messages from all conversations
            $conversationIds = $conversations->pluck('id');
            $allMessages = Message::whereIn('conversation_id', $conversationIds)
                ->with(['property', 'sender', 'conversation'])
                ->orderBy('created_at', 'asc')
                ->get();

            // Count unread messages (messages from agents/brokers that aren't read)
            $unreadCount = $allMessages->where('sender_id', '!=', null)
                ->where('sender_email', '!=', $email)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'success' => true,
                'data' => $allMessages,
                'conversations' => $conversations,
                'unread_count' => $unreadCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching customer inquiries: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch customer inquiries',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get conversation messages by conversation ID
     */
    #[OA\Get(
        path: "/conversations/{id}/messages",
        summary: "Get messages in a conversation",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "email", in: "query", required: false, schema: new OA\Schema(type: "string"), description: "Customer email for public access"),
        ],
        responses: [
            new OA\Response(response: 200, description: "Messages retrieved successfully"),
        ]
    )]
    public function getConversationMessages(Request $request, $id): JsonResponse
    {
        try {
            // Since this route is public, manually authenticate user if token is present
            $user = null;
            $token = $request->bearerToken();
            if ($token) {
                // Manually authenticate using Sanctum token
                $accessToken = PersonalAccessToken::findToken($token);
                if ($accessToken) {
                    $user = $accessToken->tokenable;
                }
            }
            
            $customerEmail = $request->query('email');

            $conversation = InquiryConversation::findOrFail($id);

            // Check if user has access to this conversation
            $hasAccess = false;
            
            // For authenticated agents/brokers
            if ($user && ($user->isAgent() || $user->isBroker())) {
                // Primary check: Check if user is the agent/broker for this conversation
                if ($user->isAgent() && $conversation->agent_id && (int)$conversation->agent_id === (int)$user->id) {
                    $hasAccess = true;
                } elseif ($user->isBroker() && $conversation->broker_id && (int)$conversation->broker_id === (int)$user->id) {
                    $hasAccess = true;
                }
                
                // Fallback: Check if user is the recipient of any messages in this conversation
                // This is the most reliable check since messages always have recipient_id
                if (!$hasAccess) {
                    $hasMessagesAsRecipient = Message::where('conversation_id', $id)
                        ->where('recipient_id', $user->id)
                        ->exists();
                    if ($hasMessagesAsRecipient) {
                        $hasAccess = true;
                    }
                }
                
                // Additional fallback: Check if user has sent any messages in this conversation
                if (!$hasAccess) {
                    $hasMessagesAsSender = Message::where('conversation_id', $id)
                        ->where('sender_id', $user->id)
                        ->exists();
                    if ($hasMessagesAsSender) {
                        $hasAccess = true;
                    }
                }
            }
            
            // For customers (public access via email)
            if (!$hasAccess && $customerEmail && $conversation->customer_email === $customerEmail) {
                $hasAccess = true;
            }

            if (!$hasAccess) {
                Log::warning('Unauthorized access attempt to conversation', [
                    'conversation_id' => $id,
                    'user_id' => $user?->id,
                    'user_type' => $user ? ($user->isAgent() ? 'agent' : ($user->isBroker() ? 'broker' : 'customer')) : 'none',
                    'conversation_agent_id' => $conversation->agent_id,
                    'conversation_broker_id' => $conversation->broker_id,
                    'customer_email' => $customerEmail,
                    'conversation_customer_email' => $conversation->customer_email,
                    'has_auth_token' => $request->bearerToken() ? 'yes' : 'no',
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to conversation',
                    'debug' => config('app.debug') ? [
                        'conversation_id' => $id,
                        'user_id' => $user?->id,
                        'conversation_agent_id' => $conversation->agent_id,
                        'conversation_broker_id' => $conversation->broker_id,
                    ] : null,
                ], 403);
            }

            $messages = Message::where('conversation_id', $id)
                ->with(['sender', 'property'])
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $messages,
                'conversation' => $conversation,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching conversation messages: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch conversation messages',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Mark conversation messages as read for customer (public endpoint).
     */
    #[OA\Put(
        path: "/conversations/{id}/mark-read",
        summary: "Mark conversation messages as read for customer",
        tags: ["Messages"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "email", in: "query", required: true, schema: new OA\Schema(type: "string"), description: "Customer email"),
        ],
        responses: [
            new OA\Response(response: 200, description: "Messages marked as read"),
        ]
    )]
    public function markConversationAsReadForCustomer(Request $request, $id): JsonResponse
    {
        try {
            $customerEmail = $request->query('email');
            
            if (!$customerEmail) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer email is required',
                ], 400);
            }

            $conversation = InquiryConversation::findOrFail($id);

            // Verify customer email matches
            if ($conversation->customer_email !== $customerEmail) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to conversation',
                ], 403);
            }

            // Mark all messages from agents/brokers as read (messages where sender is not the customer)
            $updated = Message::where('conversation_id', $id)
                ->where('sender_email', '!=', $customerEmail)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Conversation marked as read',
                'count' => $updated,
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking conversation as read: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark conversation as read',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Reply to a customer inquiry (agent/broker only).
     */
    #[OA\Post(
        path: "/messages/{id}/reply",
        summary: "Reply to a customer inquiry",
        tags: ["Messages"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer")),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["message"],
                    properties: [
                        new OA\Property(property: "message", type: "string"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Reply sent successfully"),
            new OA\Response(response: 404, description: "Message not found"),
        ]
    )]
    public function reply(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user || (!$user->isAgent() && !$user->isBroker())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Agent or Broker authentication required.',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'message' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Get the original message
            $originalMessage = Message::where('id', $id)
                ->where('recipient_id', $user->id)
                ->with('conversation')
                ->firstOrFail();

            if (!$originalMessage->conversation_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Message is not part of a conversation',
                ], 400);
            }

            $conversation = $originalMessage->conversation;

            // Create reply message (from agent to customer)
            $reply = Message::create([
                'sender_id' => $user->id,
                'recipient_id' => null, // Customer may not be registered
                'conversation_id' => $conversation->id,
                'property_id' => $originalMessage->property_id,
                'sender_name' => $user->name ?? ($user->first_name . ' ' . $user->last_name),
                'sender_email' => $user->email, // Agent's email
                'sender_phone' => null,
                'subject' => $originalMessage->subject ? 'Re: ' . $originalMessage->subject : 'Re: Inquiry',
                'message' => $request->message,
                'type' => $originalMessage->type,
            ]);

            // Update conversation last message time
            $conversation->update(['last_message_at' => now()]);

            // Mark original message as read
            $originalMessage->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Reply sent successfully',
                'data' => $reply,
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error sending reply: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send reply',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }
}

