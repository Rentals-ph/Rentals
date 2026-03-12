<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlogCommentLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'comment_id',
        'user_id',
        'guest_session_id',
    ];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(BlogComment::class, 'comment_id');
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
        int  $commentId,
        ?int $userId,
        ?int $guestSessionId,
    ): ?self {
        $query = static::where('comment_id', $commentId);

        if ($userId) {
            return $query->where('user_id', $userId)->first();
        }

        if ($guestSessionId) {
            return $query->where('guest_session_id', $guestSessionId)->first();
        }

        return null;
    }
}

