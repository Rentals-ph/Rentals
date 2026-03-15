<?php

namespace App\Http\Requests\Properties;

use Illuminate\Foundation\Http\FormRequest;

class BulkCreatePropertyRequest extends FormRequest
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
            'properties' => 'required|array|min:1|max:50', // Limit to 50 at a time
            'properties.*.title' => 'required|string|max:255',
            'properties.*.description' => 'required|string',
            'properties.*.type' => 'required|string|max:255',
            'properties.*.price' => 'required|numeric|min:0',
            'properties.*.bedrooms' => 'required|integer|min:0',
            'properties.*.bathrooms' => 'required|integer|min:0',
        ];
    }
}

