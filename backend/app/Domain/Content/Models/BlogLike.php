<?php

namespace App\Domain\Content\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlogLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'blog_id',
        'user_id',
        'guest_session_id',
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

    /**
     * Find an existing like record for the given viewer.
     */
    public static function findForViewer(
        int  $blogId,
        ?int $userId,
        ?int $guestSessionId,
    ): ?self {
        $query = static::where('blog_id', $blogId);

        if ($userId) {
            return $query->where('user_id', $userId)->first();
        }

        if ($guestSessionId) {
            return $query->where('guest_session_id', $guestSessionId)->first();
        }

        return null;
    }
}

