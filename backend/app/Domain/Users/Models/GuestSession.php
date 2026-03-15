<?php

namespace App\Domain\Users\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GuestSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'token',
        'name',
        'email',
        'last_active_at',
        'expires_at',
        'is_merged',
        'merged_into_user_id',
    ];

    protected $casts = [
        'last_active_at' => 'datetime',
        'expires_at'     => 'datetime',
        'is_merged'      => 'boolean',
    ];

    /**
     * The registered user this guest was merged into (after upgrade).
     */
    public function mergedIntoUser()
    {
        return $this->belongsTo(User::class, 'merged_into_user_id');
    }

    /**
     * Chat rooms started by this guest.
     */
    public function chatRooms()
    {
        return $this->hasMany(ChatRoom::class, 'guest_session_id');
    }

    /**
     * Reviews submitted by this guest.
     */
    public function reviews()
    {
        return $this->hasMany(Review::class, 'reviewer_id')
            ->where('reviewer_type', 'guest_session');
    }

    /**
     * Determine if this guest session is still active (not expired, not merged).
     */
    public function isActive(): bool
    {
        if ($this->is_merged) {
            return false;
        }

        if ($this->expires_at && now()->greaterThan($this->expires_at)) {
            return false;
        }

        return true;
    }

    /**
     * Touch last_active_at timestamp.
     */
    public function touchActivity(): void
    {
        $this->update(['last_active_at' => now()]);
    }

    /**
     * Find an active guest session by token.
     */
    public static function findByToken(string $token): ?self
    {
        return static::where('token', $token)
            ->where('is_merged', false)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->first();
    }
}

