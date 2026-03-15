<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'facebook' => $this->facebook,
            'role' => $this->role,
            'agency_name' => $this->agency_name,
            'company_name' => $this->company_name,
            'description' => $this->description,
            'office_address' => $this->office_address,
            'city' => $this->city,
            'state' => $this->state,
            'zip_code' => $this->zip_code,
            'prc_license_number' => $this->prc_license_number,
            'license_type' => $this->license_type,
            'years_of_experience' => $this->years_of_experience,
            'image_url' => $this->image_url ?? null,
            'slug' => $this->slug,
            'status' => $this->status,
            'verified' => $this->verified,
            'is_active' => $this->is_active,
            'views_count' => $this->views_count,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}

