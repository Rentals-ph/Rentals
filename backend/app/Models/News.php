<?php

namespace App\Models;

use App\Traits\HasMedia;
use App\Traits\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class News extends Model
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
        'views_count'    => 'integer',
        'likes_count'    => 'integer',
        'comments_count' => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Engagement relationships
    // -------------------------------------------------------------------------

    public function views(): HasMany
    {
        return $this->hasMany(NewsView::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(NewsLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(NewsComment::class)->whereNull('parent_id')->latest();
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(NewsComment::class)->latest();
    }

    // -------------------------------------------------------------------------
    // Image accessors
    // -------------------------------------------------------------------------

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
