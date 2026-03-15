<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePageBuilderRequest extends FormRequest
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
            'user_type' => 'sometimes|in:agent,broker',
            'page_type' => 'sometimes|in:profile,property',
            'page_data' => 'sometimes|array', // All page customization data
            'page_slug' => 'nullable|string|max:255',
        ];
    }
}

