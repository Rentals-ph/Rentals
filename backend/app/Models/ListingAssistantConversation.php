<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListingAssistantConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'extracted_data',
        'skipped_fields',
        'messages',
        'status',
        'current_step',
        'last_message_at',
    ];

    protected $casts = [
        'extracted_data' => 'array',
        'skipped_fields' => 'array',
        'messages' => 'array',
        'last_message_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_SUBMITTED = 'submitted';

    /**
     * Required fields for a complete listing
     */
    public const REQUIRED_FIELDS = [
        'property_name',
        'property_type',
        'location',
        'price',
        'price_type',
        'bedrooms',
        'bathrooms',
    ];

    /**
     * Optional fields that the AI can extract
     */
    public const OPTIONAL_FIELDS = [
        'address',
        'area_sqm',
        'lot_area_sqm',
        'parking_slots',
        'amenities',
        'furnishing_status',
        'hoa_fee',
        'property_age',
        'floor_level',
        'title_type',
        'description',
        'status',
    ];

    /**
     * Valid property types
     */
    public const PROPERTY_TYPES = [
        'house',
        'condo',
        'apartment',
        'lot',
        'commercial',
        'townhouse',
        'studio',
        'bedspace',
        'warehouse',
        'office',
    ];

    /**
     * Valid listing statuses
     */
    public const LISTING_STATUSES = [
        'for_sale',
        'for_rent',
        'pre_selling',
    ];

    /**
     * Valid furnishing statuses
     */
    public const FURNISHING_STATUSES = [
        'unfurnished',
        'semi_furnished',
        'fully_furnished',
    ];

    /**
     * Get the user that owns this conversation
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a unique conversation ID
     */
    public static function generateConversationId(): string
    {
        return 'listing_' . uniqid() . '_' . time();
    }

    /**
     * Check if all required fields are filled
     */
    public function isFormReady(): bool
    {
        if (!$this->extracted_data) {
            return false;
        }

        $skippedFields = $this->skipped_fields ?? [];

        foreach (self::REQUIRED_FIELDS as $field) {
            // If field is skipped, it counts as "handled"
            if (in_array($field, $skippedFields)) {
                continue;
            }

            // If field is not set or is null/empty
            if (!isset($this->extracted_data[$field]) || 
                $this->extracted_data[$field] === null || 
                $this->extracted_data[$field] === '') {
                return false;
            }
        }

        return true;
    }

    /**
     * Get missing required fields
     */
    public function getMissingFields(): array
    {
        $missing = [];
        $skippedFields = $this->skipped_fields ?? [];
        $data = $this->extracted_data ?? [];

        foreach (self::REQUIRED_FIELDS as $field) {
            // Skip fields that were explicitly skipped
            if (in_array($field, $skippedFields)) {
                continue;
            }

            // Check if field is missing
            if (!isset($data[$field]) || 
                $data[$field] === null || 
                $data[$field] === '') {
                $missing[] = $field;
            }
        }

        return $missing;
    }

    /**
     * Check if enough core info is provided for description generation
     * Minimum: property_type, location, bedrooms, price
     */
    public function canGenerateDescription(): bool
    {
        $data = $this->extracted_data ?? [];
        $minimumFields = ['property_type', 'location', 'bedrooms', 'price'];

        foreach ($minimumFields as $field) {
            if (!isset($data[$field]) || 
                $data[$field] === null || 
                $data[$field] === '') {
                return false;
            }
        }

        return true;
    }

    /**
     * Add a message to the conversation
     */
    public function addMessage(string $role, string $content): void
    {
        $messages = $this->messages ?? [];
        $messages[] = [
            'role' => $role,
            'content' => $content,
            'timestamp' => now()->toIso8601String(),
        ];
        $this->messages = $messages;
        $this->last_message_at = now();
        $this->save();
    }

    /**
     * Update extracted data with new values
     */
    public function updateExtractedData(array $newData): void
    {
        $currentData = $this->extracted_data ?? [];
        
        foreach ($newData as $key => $value) {
            // Only update if value is not null (don't overwrite with null)
            if ($value !== null) {
                $currentData[$key] = $value;
            }
        }

        $this->extracted_data = $currentData;
        $this->save();
    }

    /**
     * Add fields to skipped list
     */
    public function skipFields(array $fields): void
    {
        $skipped = $this->skipped_fields ?? [];
        $this->skipped_fields = array_unique(array_merge($skipped, $fields));
        $this->save();
    }
}
