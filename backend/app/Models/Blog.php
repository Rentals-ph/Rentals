<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Blog extends Model
{
    use HasFactory;

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
     * Get the full URL of the image.
     *
     * @return string|null
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        return asset('storage/' . $this->image_path);
    }
}

