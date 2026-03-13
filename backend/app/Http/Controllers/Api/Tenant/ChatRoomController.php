<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\GuestSession;
use App\Models\Property;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Chat rooms and messages.
 *
 * All endpoints accept either:
 *   - auth:sanctum token  (registered tenant, agent, or broker)
 *   - X-Guest-Token header / guest_token cookie  (guest session)
 *
 * The guest.session middleware runs on all routes in this controller to attach
 * $request->attributes->get('guest_session') when a valid token is present.
 */
class ChatRoomController extends Controller
{
    // =========================================================================
    // Inbox
    // =========================================================================

    /**
     * List all chat rooms for the authenticated user.
     * Agents/brokers see all rooms where they are the agent.
     * Tenants see all rooms where they are the tenant.
     *
     * GET /chat/rooms
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user  = $request->user();
            $guest = $request->attributes->get('guest_session');

            if (!$user && !$guest) {
                return $this->unauthenticated();
            }

            if ($user) {
                if ($user->isAgent() || $user->isBroker()) {
                    $rooms = ChatRoom::where('agent_id', $user->id)
                        ->with(['property', 'tenant', 'guestSession', 'latestMessage'])
                        ->orderByDesc('last_message_at')
                        ->get();
                } else {
                    // Tenant
                    $rooms = ChatRoom::where('user_id', $user->id)
                        ->with(['property', 'agent', 'latestMessage'])
                        ->orderByDesc('last_message_at')
                        ->get();
                }

                // Attach unread counts
                $rooms->each(function (ChatRoom $room) use ($user) {
                    $room->unread_count = $room->unreadCountForUser($user);
                });
            } else {
                // Guest
                $rooms = ChatRoom::where('guest_session_id', $guest->id)
                    ->with(['property', 'agent', 'latestMessage'])
                    ->orderByDesc('last_message_at')
                    ->get();

                $rooms->each(function (ChatRoom $room) use ($guest) {
                    $room->unread_count = $room->unreadCountForGuest($guest);
                });
            }

            return response()->json([
                'success' => true,
                'data'    => $rooms,
            ]);

        } catch (\Exception $e) {
            Log::error('ChatRoomController@index: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch inbox.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // =========================================================================
    // Start / find a room
    // =========================================================================

    /**
     * Find or create a chat room for a property.
     * Called by a tenant/guest when they click "Chat with agent".
     *
     * POST /chat/rooms
     * Body: { property_id }
     */
    public function findOrCreate(Request $request): JsonResponse
    {
        try {
            $user  = $request->user();
            $guest = $request->attributes->get('guest_session');

            if (!$user && !$guest) {
                return $this->unauthenticated();
            }

            $validator = Validator::make($request->all(), [
                'property_id' => 'required|integer|exists:properties,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $property = Property::findOrFail($request->property_id);
            $agentId  = $property->agent_id;

            // A tenant/guest cannot start a chat with themselves
            if ($user && $user->id === $agentId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot start a chat room for your own listing.',
                ], 422);
            }

            $room = DB::transaction(function () use ($property, $agentId, $user, $guest) {
                if ($user) {
                    $room = ChatRoom::firstOrCreate(
                        [
                            'property_id' => $property->id,
                            'agent_id'    => $agentId,
                            'user_id'     => $user->id,
                        ],
                        ['last_message_at' => now()]
                    );
                } else {
                    $room = ChatRoom::firstOrCreate(
                        [
                            'property_id'      => $property->id,
                            'agent_id'         => $agentId,
                            'guest_session_id' => $guest->id,
                        ],
                        ['last_message_at' => now()]
                    );
                }

                return $room;
            });

            $room->load(['property', 'agent', 'latestMessage']);

            return response()->json([
                'success' => true,
                'data'    => $room,
            ], 200);

        } catch (\Exception $e) {
            Log::error('ChatRoomController@findOrCreate: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to open chat room.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // =========================================================================
    // Messages
    // =========================================================================

    /**
     * Fetch messages in a room (marks them as read for the requester).
     *
     * GET /chat/rooms/{roomId}/messages
     */
    public function messages(Request $request, int $roomId): JsonResponse
    {
        try {
            $user  = $request->user();
            $guest = $request->attributes->get('guest_session');

            if (!$user && !$guest) {
                return $this->unauthenticated();
            }

            $room = ChatRoom::findOrFail($roomId);

            if (!$this->canAccess($room, $user, $guest)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this chat room.',
                ], 403);
            }

            // Mark incoming messages as read
            $this->markMessagesRead($room, $user, $guest);

            $messages = $room->messages()
                ->orderBy('created_at')
                ->get()
                ->map(fn (ChatMessage $msg) => $this->formatMessage($msg));

            return response()->json([
                'success' => true,
                'data'    => $messages,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Chat room not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ChatRoomController@messages: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch messages.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Send a message in a room.
     *
     * POST /chat/rooms/{roomId}/messages
     * Body: { body }
     */
    public function sendMessage(Request $request, int $roomId): JsonResponse
    {
        try {
            $user  = $request->user();
            $guest = $request->attributes->get('guest_session');

            if (!$user && !$guest) {
                return $this->unauthenticated();
            }

            $validator = Validator::make($request->all(), [
                'body' => 'required|string|max:5000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $room = ChatRoom::findOrFail($roomId);

            if (!$this->canAccess($room, $user, $guest)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this chat room.',
                ], 403);
            }

            $message = DB::transaction(function () use ($request, $room, $user, $guest) {
                $senderType = $user ? 'user' : 'guest_session';
                $senderId   = $user ? $user->id : $guest->id;

                $message = ChatMessage::create([
                    'chat_room_id' => $room->id,
                    'sender_type'  => $senderType,
                    'sender_id'    => $senderId,
                    'body'         => $request->body,
                ]);

                // Update room timestamp
                $room->update(['last_message_at' => now()]);

                // Notify the OTHER party
                $this->notifyOtherParty($room, $user, $guest, $message);

                return $message;
            });

            return response()->json([
                'success' => true,
                'message' => 'Message sent.',
                'data'    => $this->formatMessage($message),
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Chat room not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ChatRoomController@sendMessage: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to send message.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Mark all messages in a room as read for the current user/guest.
     *
     * PUT /chat/rooms/{roomId}/read
     */
    public function markRead(Request $request, int $roomId): JsonResponse
    {
        try {
            $user  = $request->user();
            $guest = $request->attributes->get('guest_session');

            if (!$user && !$guest) {
                return $this->unauthenticated();
            }

            $room = ChatRoom::findOrFail($roomId);

            if (!$this->canAccess($room, $user, $guest)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied.',
                ], 403);
            }

            $this->markMessagesRead($room, $user, $guest);

            return response()->json([
                'success' => true,
                'message' => 'Messages marked as read.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Chat room not found.'], 404);
        } catch (\Exception $e) {
            Log::error('ChatRoomController@markRead: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark messages as read.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /** Check if the user or guest is a participant in the room. */
    private function canAccess(ChatRoom $room, ?User $user, ?GuestSession $guest): bool
    {
        if ($user) {
            return $room->hasParticipant($user);
        }

        if ($guest) {
            return $room->hasGuestParticipant($guest);
        }

        return false;
    }

    /**
     * Mark messages in the room as read for the requesting party.
     * Only messages NOT sent by the current party are marked.
     */
    private function markMessagesRead(ChatRoom $room, ?User $user, ?GuestSession $guest): void
    {
        $query = ChatMessage::where('chat_room_id', $room->id)
            ->where('is_read', false);

        if ($user) {
            // Mark messages not sent by this user
            $query->where(function ($q) use ($user) {
                $q->where('sender_type', '!=', 'user')
                  ->orWhere(function ($q2) use ($user) {
                      $q2->where('sender_type', 'user')
                         ->where('sender_id', '!=', $user->id);
                  });
            });
        } elseif ($guest) {
            $query->where(function ($q) use ($guest) {
                $q->where('sender_type', '!=', 'guest_session')
                  ->orWhere(function ($q2) use ($guest) {
                      $q2->where('sender_type', 'guest_session')
                         ->where('sender_id', '!=', $guest->id);
                  });
            });
        }

        $query->update(['is_read' => true, 'read_at' => now()]);
    }

    /** Fire an in-app notification to the receiving party. */
    private function notifyOtherParty(
        ChatRoom $room,
        ?User $senderUser,
        ?GuestSession $senderGuest,
        ChatMessage $message
    ): void {
        // Notify the agent if the message was sent by the tenant/guest
        if ($senderUser && $senderUser->id !== $room->agent_id) {
            UserNotification::notify(
                $room->agent_id,
                'new_chat_message',
                'New message from ' . $senderUser->full_name,
                \Str::limit($message->body, 100),
                ['chat_room_id' => $room->id, 'property_id' => $room->property_id]
            );
        } elseif ($senderGuest) {
            // Guest sent a message → notify agent
            UserNotification::notify(
                $room->agent_id,
                'new_chat_message',
                'New message from ' . $senderGuest->name,
                \Str::limit($message->body, 100),
                ['chat_room_id' => $room->id, 'property_id' => $room->property_id]
            );
        }

        // Notify the tenant if the message was sent by the agent
        if ($senderUser && $senderUser->id === $room->agent_id && $room->user_id) {
            UserNotification::notify(
                $room->user_id,
                'new_chat_message',
                'New message from your agent',
                \Str::limit($message->body, 100),
                ['chat_room_id' => $room->id, 'property_id' => $room->property_id]
            );
        }
    }

    /** Format a message for API response. */
    private function formatMessage(ChatMessage $message): array
    {
        return [
            'id'          => $message->id,
            'chat_room_id' => $message->chat_room_id,
            'sender_type' => $message->sender_type,
            'sender_id'   => $message->sender_id,
            'sender_name' => $message->sender_name,
            'body'        => $message->body,
            'is_read'     => $message->is_read,
            'read_at'     => $message->read_at,
            'created_at'  => $message->created_at,
        ];
    }

    private function unauthenticated(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Authentication required. Please log in or provide a guest token.',
        ], 401);
    }
}

