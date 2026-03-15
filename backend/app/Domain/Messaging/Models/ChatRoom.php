<?php

namespace App\Domain\Messaging\Models;

use App\Domain\Properties\Models\Property;
use App\Domain\Users\Models\User;
use App\Domain\Users\Models\GuestSession;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'agent_id',
        'user_id',
        'guest_session_id',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    /** The agent who owns the listing in this room. */
    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    /** The registered tenant in this room (null for guest rooms). */
    public function tenant()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** The guest session in this room (null for registered-tenant rooms). */
    public function guestSession()
    {
        return $this->belongsTo(GuestSession::class, 'guest_session_id');
    }

    /** All messages in this room. */
    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'chat_room_id')->orderBy('created_at');
    }

    /** Most recent message. */
    public function latestMessage()
    {
        return $this->hasOne(ChatMessage::class, 'chat_room_id')->latestOfMany();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Determine if the given user (registered) is a participant in this room.
     */
    public function hasParticipant(User $user): bool
    {
        return $this->agent_id === $user->id || $this->user_id === $user->id;
    }

    /**
     * Determine if a given guest session is a participant in this room.
     */
    public function hasGuestParticipant(GuestSession $guest): bool
    {
        return $this->guest_session_id === $guest->id;
    }

    /**
     * Count unread messages for the given user side of the room.
     * Unread = messages NOT sent by this user that have is_read = false.
     */
    public function unreadCountForUser(User $user): int
    {
        return $this->messages()
            ->where('is_read', false)
            ->where(function ($q) use ($user) {
                // Exclude messages the user themselves sent
                $q->where('sender_type', '!=', 'user')
                  ->orWhere(function ($q2) use ($user) {
                      $q2->where('sender_type', 'user')
                         ->where('sender_id', '!=', $user->id);
                  });
            })
            ->count();
    }

    /**
     * Count unread messages for the given guest side of the room.
     */
    public function unreadCountForGuest(GuestSession $guest): int
    {
        return $this->messages()
            ->where('is_read', false)
            ->where(function ($q) use ($guest) {
                $q->where('sender_type', '!=', 'guest_session')
                  ->orWhere(function ($q2) use ($guest) {
                      $q2->where('sender_type', 'guest_session')
                         ->where('sender_id', '!=', $guest->id);
                  });
            })
            ->count();
    }
}

