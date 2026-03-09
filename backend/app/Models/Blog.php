<?php

namespace App\Models;

use App\Traits\HasMedia;
use App\Traits\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Blog extends Model
{
    use HasFactory, HasMedia, HasSlug;

    /** Slug is generated from `title` (HasSlug default). */
    protected string $slugFrom = 'title';

    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'category',
        'read_time',
        'likes',      // Legacy column kept for backward compat
        'comments',   // Legacy column kept for backward compat
        'author',
        'image',
        'image_path',
        'published_at',
        'views_count',
        'likes_count',
        'comments_count',
    ];

    protected $casts = [
        'published_at'   => 'datetime',
        'read_time'      => 'integer',
        'likes'          => 'integer',
        'comments'       => 'integer',
        'views_count'    => 'integer',
        'likes_count'    => 'integer',
        'comments_count' => 'integer',
    ];

    /**
     * Get the image path.
     * Checks media table first, falls back to old image_path/image columns.
     * This accessor transparently replaces direct column access.
     */
    public function getImagePathAttribute(): ?string
    {
        return $this->getFirstMediaPath('thumbnail')
            ?? $this->attributes['image_path'] ?? null
            ?? $this->attributes['image'] ?? null;
    }

    // -------------------------------------------------------------------------
    // Engagement relationships
    // -------------------------------------------------------------------------

    public function views(): HasMany
    {
        return $this->hasMany(BlogView::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(BlogLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(BlogComment::class)->whereNull('parent_id')->latest();
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(BlogComment::class)->latest();
    }

    // -------------------------------------------------------------------------
    // Image accessors
    // -------------------------------------------------------------------------

    /**
     * Get the full URL of the image.
     *
     * @return string|null
     */
    public function getImageUrlAttribute(): ?string
    {
        // Delegate to getImagePathAttribute which handles media table fallback
        $path = $this->image_path;
        if (!$path) {
            return null;
        }

        // If it's already a full URL, return as is
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return asset('storage/' . $path);
    }
}
