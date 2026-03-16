<?php

namespace App\Domain\Users\Models;

use App\Domain\Messaging\Models\Message;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InquiryConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'broker_id',
        'customer_email',
        'customer_name',
        'property_id',
        'type',
        'subject',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    /**
     * Get the agent user
     */
    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    /**
     * Get the broker user
     */
    public function broker()
    {
        return $this->belongsTo(User::class, 'broker_id');
    }

    /**
     * Get the property
     */
    public function property()
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    /**
     * Get all messages in this conversation
     */
    public function messages()
    {
        return $this->hasMany(Message::class, 'conversation_id')->orderBy('created_at', 'asc');
    }

    /**
     * Get the latest message
     */
    public function latestMessage()
    {
        return $this->hasOne(Message::class, 'conversation_id')->latestOfMany();
    }

    /**
     * Get unread messages count for a user
     */
    public function getUnreadCountForUser($userId)
    {
        return $this->messages()
            ->where('recipient_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}

