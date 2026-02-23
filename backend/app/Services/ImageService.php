<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImageService
{
    /**
     * Upload an image file to storage.
     *
     * @param UploadedFile|null $file
     * @param string $directory
     * @return string|null
     */
    public static function upload(?UploadedFile $file, string $directory = 'images/posts'): ?string
    {
        if (!$file || !$file->isValid()) {
            return null;
        }

        return $file->store($directory, 'public');
    }

    /**
     * Delete an image file from storage.
     *
     * @param string|null $imagePath
     * @return bool
     */
    public static function delete(?string $imagePath): bool
    {
        if (!$imagePath) {
            return false;
        }

        return Storage::disk('public')->delete($imagePath);
    }

    /**
     * Get the full URL for an image path.
     *
     * @param string|null $imagePath
     * @return string|null
     */
    public static function url(?string $imagePath): ?string
    {
        if (!$imagePath) {
            return null;
        }

        return asset('storage/' . $imagePath);
    }
}

