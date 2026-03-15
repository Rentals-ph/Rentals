<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;

class CreatePageBuilderRequest extends FormRequest
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
            'user_type' => 'required|in:agent,broker',
            'page_type' => 'required|in:profile,property',
            'page_data' => 'required|array', // All page customization data
            'page_slug' => 'nullable|string|max:255',
        ];
    }
}

