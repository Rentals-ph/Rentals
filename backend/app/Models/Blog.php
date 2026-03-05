<?php

namespace App\Models;

use App\Traits\HasMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Blog extends Model
{
    use HasFactory, HasMedia;

    protected $fillable = [
        'title',
        'content',
        'excerpt',
        'category',
        'read_time',
        'likes',
        'comments',
        'author',
        'image',
        'image_path',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'read_time' => 'integer',
        'likes' => 'integer',
        'comments' => 'integer',
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
