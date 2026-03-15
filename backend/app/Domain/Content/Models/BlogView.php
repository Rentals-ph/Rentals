<?php

namespace App\Domain\Content\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlogView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'blog_id',
        'user_id',
        'guest_session_id',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function blog(): BelongsTo
    {
        return $this->belongsTo(Blog::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guestSession(): BelongsTo
    {
        return $this->belongsTo(GuestSession::class);
    }

    public static function alreadyViewed(
        int    $blogId,
        ?int   $userId,
        ?int   $guestSessionId,
        string $ip,
    ): bool {
        $query = static::where('blog_id', $blogId)
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

