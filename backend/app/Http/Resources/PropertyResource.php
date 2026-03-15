<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'type' => $this->type,
            'listing_type' => $this->listing_type,
            'price' => $this->price,
            'price_type' => $this->price_type,
            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'garage' => $this->garage,
            'area' => $this->area,
            'lot_area' => $this->lot_area,
            'floor_area_unit' => $this->floor_area_unit,
            'amenities' => $this->amenities,
            'furnishing' => $this->furnishing,
            'image_url' => $this->image_url,
            'images_url' => $this->images_url,
            'video_url' => $this->video_url,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'country' => $this->country,
            'state_province' => $this->state_province,
            'city' => $this->city,
            'street_address' => $this->street_address,
            'is_featured' => $this->is_featured,
            'status' => $this->status,
            'views_count' => $this->views_count,
            'published_at' => $this->published_at?->toDateTimeString(),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'agent' => $this->whenLoaded('agent', function () {
                return [
                    'id' => $this->agent->id,
                    'first_name' => $this->agent->first_name,
                    'last_name' => $this->agent->last_name,
                    'email' => $this->agent->email,
                    'slug' => $this->agent->slug,
                ];
            }),
        ];
    }
}

