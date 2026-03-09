<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_room_id',
        'sender_type',
        'sender_id',
        'body',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function chatRoom()
    {
        return $this->belongsTo(ChatRoom::class, 'chat_room_id');
    }

    /**
     * Sender when sender_type = 'user'.
     */
    public function senderUser()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Sender when sender_type = 'guest_session'.
     */
    public function senderGuest()
    {
        return $this->belongsTo(GuestSession::class, 'sender_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Mark this message as read.
     */
    public function markAsRead(): void
    {
        if (!$this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }

    /**
     * Resolve the sender display name regardless of type.
     */
    public function getSenderNameAttribute(): string
    {
        if ($this->sender_type === 'user') {
            $user = $this->senderUser;
            return $user ? $user->full_name : 'Unknown User';
        }

        if ($this->sender_type === 'guest_session') {
            $guest = $this->senderGuest;
            return $guest ? $guest->name : 'Guest';
        }

        return 'Unknown';
    }
}

