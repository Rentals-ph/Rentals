<?php

namespace App\Domain\Properties\Models;

use App\Domain\Users\Models\User;
use App\Domain\Users\Models\Review;
use App\Domain\Messaging\Models\ChatRoom;
use App\Traits\HasMedia;
use App\Traits\HasSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory, HasMedia, HasSlug;

    /** Slug is generated from the `title` field (HasSlug default). */
    protected string $slugFrom = 'title';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'description_template',
        'ai_generated_description',
        'type',
        'listing_type',
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
        'status',
        'views_count',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'price' => 'decimal:2',
        'published_at' => 'datetime',
        'amenities' => 'array',
        'images' => 'array',
    ];

    /**
     * Valid listing statuses.
     */
    public const STATUSES = ['available', 'rented', 'under_negotiation', 'unlisted'];

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
     * Reviews for this property.
     */
    public function reviews()
    {
        return $this->hasMany(Review::class, 'reviewable_id')
            ->where('reviewable_type', self::class);
    }

    /**
     * Approved reviews only.
     */
    public function approvedReviews()
    {
        return $this->reviews()->where('status', 'approved');
    }

    /**
     * Users who saved this property.
     */
    public function savedByUsers()
    {
        return $this->hasMany(SavedProperty::class);
    }

    /**
     * Chat rooms associated with this property.
     */
    public function chatRooms()
    {
        return $this->hasMany(ChatRoom::class);
    }

    /**
     * Individual view records for this property.
     */
    public function views()
    {
        return $this->hasMany(PropertyView::class);
    }

    /**
     * Get the thumbnail image path.
     * Checks media table first, falls back to old columns.
     */
    public function getThumbnailAttribute(): ?string
    {
        return $this->getFirstMediaPath('thumbnail')
            ?? $this->image_path
            ?? $this->image;
    }

    /**
     * Get the gallery images as an array.
     * Checks media table first, falls back to old images column.
     */
    public function getGalleryAttribute(): array
    {
        $fromMedia = $this->getMedia('gallery')->pluck('path')->toArray();
        if (!empty($fromMedia)) {
            return $fromMedia;
        }
        // Use getRawOriginal to bypass the 'array' cast and get the raw JSON string
        $rawImages = $this->getRawOriginal('images');
        return json_decode($rawImages ?? '[]', true) ?? [];
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

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    public function isForRent(): bool
    {
        return $this->listing_type === 'for_rent' || in_array(strtolower((string) $this->type), ['rent', 'for rent']);
    }

    public function isForSale(): bool
    {
        return $this->listing_type === 'for_sale' || in_array(strtolower((string) $this->type), ['sale', 'for sale']);
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeForRent($query)
    {
        return $query->where(function($q) {
            $q->where('listing_type', 'for_rent')
              ->orWhereIn(\DB::raw('LOWER(type)'), ['rent', 'for rent']);
        });
    }

    public function scopeForSale($query)
    {
        return $query->where(function($q) {
            $q->where('listing_type', 'for_sale')
              ->orWhereIn(\DB::raw('LOWER(type)'), ['sale', 'for sale']);
        });
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }
}
