<?php

namespace App\Http\Requests\Properties;

use Illuminate\Foundation\Http\FormRequest;

class CreatePropertyRequest extends FormRequest
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
        return [
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:properties,slug|regex:/^[a-z0-9-]+$/',
            'description' => 'required|string',
            'type' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'listing_type' => 'nullable|string|in:for_rent,for_sale',
            'price_type' => 'nullable|string|in:Monthly,Weekly,Daily,Yearly,monthly,weekly,daily,yearly',
            'bedrooms' => 'required|integer|min:0',
            'bathrooms' => 'required|integer|min:0',
            'garage' => 'nullable|integer|min:0',
            'area' => 'nullable|integer|min:0',
            'lot_area' => 'nullable|integer|min:0',
            'floor_area_unit' => 'nullable|string|in:Square Meters,Square Feet',
            'amenities' => 'nullable|string',
            'furnishing' => 'nullable|string|in:Fully Furnished,Semi Furnished,Unfurnished',
            'image' => 'nullable|file|mimetypes:image/jpeg,image/png,image/gif,image/webp|max:10240',
            'images' => 'nullable|array',
            'images.*' => 'file|mimetypes:image/jpeg,image/png,image/gif,image/webp|max:10240',
            'video_url' => 'nullable|url|max:500',
            'latitude' => 'nullable|string|max:50',
            'longitude' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:100',
            'state_province' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'street_address' => 'nullable|string|max:255',
        ];
    }
}

