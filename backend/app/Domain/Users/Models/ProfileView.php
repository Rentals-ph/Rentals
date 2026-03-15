<?php

namespace App\Domain\Users\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ProfileView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'viewable_type',
        'viewable_id',
        'user_id',
        'guest_session_id',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    /**
     * The entity being viewed (currently always a User — agent or broker).
     */
    public function viewable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guestSession(): BelongsTo
    {
        return $this->belongsTo(GuestSession::class);
    }

    /**
     * Check whether the given viewer has already viewed a profile today.
     */
    public static function alreadyViewed(
        string $viewableType,
        int    $viewableId,
        ?int   $userId,
        ?int   $guestSessionId,
        string $ip,
    ): bool {
        $query = static::where('viewable_type', $viewableType)
            ->where('viewable_id', $viewableId)
            ->whereDate('viewed_at', now()->toDateString());

        if ($userId) {
            return $query->where('user_id', $userId)->exists();
        }

        if ($guestSessionId) {
            return $query->where('guest_session_id', $guestSessionId)->exists();
        }

        return $query->whereNull('user_id')
            ->whereNull('guest_session_id')
            ->where('ip_address', $ip)
            ->exists();
    }
}

