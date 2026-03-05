<?php

namespace App\Models;

use App\Traits\HasMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    use HasFactory, HasMedia;

    protected $fillable = [
        'name',
        'role',
        'content',
        'avatar',
    ];

    /**
     * Get the avatar URL.
     * Checks media table first, falls back to old avatar column.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        return $this->getFirstMediaPath('avatar') ?? $this->attributes['avatar'] ?? null;
    }
}
