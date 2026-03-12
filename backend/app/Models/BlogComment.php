<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BlogComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'blog_id',
        'user_id',
        'guest_session_id',
        'parent_id',
        'name',
        'email',
        'content',
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

    public function parent(): BelongsTo
    {
        return $this->belongsTo(BlogComment::class, 'parent_id');
    }

    /**
     * Direct replies to this comment (one level deep).
     */
    public function replies(): HasMany
    {
        return $this->hasMany(BlogComment::class, 'parent_id');
    }

    /**
     * Likes for this comment.
     */
    public function likes(): HasMany
    {
        return $this->hasMany(BlogCommentLike::class, 'comment_id');
    }

    /**
     * Resolved display name: user's full name, the provided guest name, or "Guest".
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->user_id && $this->relationLoaded('user') && $this->user) {
            return $this->user->full_name;
        }

        return $this->name ?? 'Guest';
    }
}

