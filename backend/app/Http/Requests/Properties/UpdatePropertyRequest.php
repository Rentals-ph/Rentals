<?php

namespace App\Http\Requests\Properties;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePropertyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled in controller
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $propertyId = $this->route('id');
        
        return [
            'title' => 'sometimes|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', Rule::unique('properties', 'slug')->ignore($propertyId)],
            'description' => 'sometimes|string',
            'type' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'listing_type' => 'nullable|string|in:for_rent,for_sale',
            'price_type' => 'nullable|string|in:Monthly,Weekly,Daily,Yearly,monthly,weekly,daily,yearly',
            'bedrooms' => 'sometimes|integer|min:0',
            'bathrooms' => 'sometimes|integer|min:0',
            'garage' => 'nullable|integer|min:0',
            'area' => 'nullable|integer|min:0',
            'lot_area' => 'nullable|integer|min:0',
            'floor_area_unit' => 'nullable|string|in:Square Meters,Square Feet',
            'amenities' => 'nullable|string',
            'furnishing' => 'nullable|string|in:Fully Furnished,Semi Furnished,Unfurnished',
            'image' => 'nullable|file|mimetypes:image/jpeg,image/png,image/gif,image/webp|max:10240',
            'images' => 'nullable|array',
            'images.*' => 'file|mimetypes:image/jpeg,image/png,image/gif,image/webp|max:10240',
            'keep_images' => 'nullable|string', // JSON array of image paths to keep
            'video_url' => 'nullable|url|max:500',
            'latitude' => 'nullable|string|max:50',
            'longitude' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'state_province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'street_address' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ];
    }
}

