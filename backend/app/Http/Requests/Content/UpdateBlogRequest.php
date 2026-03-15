<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBlogRequest extends FormRequest
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
        $blogId = $this->route('id') ?? $this->route('slug');
        
        // Handle both numeric ID and slug
        $uniqueRule = is_numeric($blogId)
            ? Rule::unique('blogs', 'slug')->ignore($blogId)
            : Rule::unique('blogs', 'slug')->ignore($blogId, 'slug');
        
        return [
            'title' => 'sometimes|string|max:255',
            'slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', $uniqueRule],
            'content' => 'sometimes|string',
            'excerpt' => 'nullable|string|max:500',
            'category' => 'nullable|string|max:100',
            'author' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'published_at' => 'nullable|date',
        ];
    }
}

