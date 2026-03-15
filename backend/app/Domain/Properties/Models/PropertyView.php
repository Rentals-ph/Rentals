<?php

namespace App\Domain\Properties\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyView extends Model
{
    use HasFactory;

    /**
     * No updated_at — we only track when a view was recorded.
     */
    public $timestamps = false;

    protected $fillable = [
        'property_id',
        'user_id',
        'guest_session_id',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
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
     * Check whether the given viewer has already viewed a property today.
     */
    public static function alreadyViewed(
        int    $propertyId,
        ?int   $userId,
        ?int   $guestSessionId,
        string $ip,
    ): bool {
        $query = static::where('property_id', $propertyId)
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

