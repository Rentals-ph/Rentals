<?php

namespace App\Domain\Content\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'news_id',
        'user_id',
        'guest_session_id',
    ];

    public function news(): BelongsTo
    {
        return $this->belongsTo(News::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guestSession(): BelongsTo
    {
        return $this->belongsTo(GuestSession::class);
    }

    public static function findForViewer(
        int  $newsId,
        ?int $userId,
        ?int $guestSessionId,
    ): ?self {
        $query = static::where('news_id', $newsId);

        if ($userId) {
            return $query->where('user_id', $userId)->first();
        }

        if ($guestSessionId) {
            return $query->where('guest_session_id', $guestSessionId)->first();
        }

        return null;
    }
}

