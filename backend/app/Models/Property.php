<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'description_template',
        'ai_generated_description',
        'type',
        'price',
        'price_type',
        'bedrooms',
        'bathrooms',
        'garage',
        'area',
        'lot_area',
        'floor_area_unit',
        'amenities',
        'furnishing',
        'image',
        'image_path',
        'images',
        'video_url',
        'latitude',
        'longitude',
        'country',
        'state_province',
        'city',
        'street_address',
        'is_featured',
        'agent_id',
        'published_at',
        'draft_status',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'price' => 'decimal:2',
        'published_at' => 'datetime',
        'amenities' => 'array',
        'images' => 'array',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['image_url', 'images_url'];

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    /**
     * Get the full URL of the image.
     *
     * @return string|null
     */
    public function getImageUrlAttribute(): ?string
    {
        // First try image_path (new storage structure)
        if ($this->image_path) {
            return asset('storage/' . $this->image_path);
        }

        // Fall back to image field (legacy)
        if ($this->image) {
            // If it's already a full URL, return as is
            if (str_starts_with($this->image, 'http://') || str_starts_with($this->image, 'https://')) {
                return $this->image;
            }
            // If it's a storage path, prepend storage/
            if (str_starts_with($this->image, '/storage/')) {
                return asset($this->image);
            }
            // Otherwise, assume it's in storage
            return asset('storage/' . $this->image);
        }

        return null;
    }

    /**
     * Get the full URLs of all gallery images.
     *
     * @return array
     */
    public function getImagesUrlAttribute(): array
    {
        if (!$this->images || !is_array($this->images)) {
            return [];
        }

        return array_map(function ($imagePath) {
            if (!$imagePath) {
                return null;
            }

            // If it's already a full URL, return as is
            if (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://')) {
                return $imagePath;
            }

            // If it's a storage path, prepend storage/
            if (str_starts_with($imagePath, '/storage/')) {
                return asset($imagePath);
            }

            // Otherwise, assume it's in storage
            return asset('storage/' . $imagePath);
        }, $this->images);
    }
}

