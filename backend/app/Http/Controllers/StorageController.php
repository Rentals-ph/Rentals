<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StorageController extends Controller
{
    /**
     * Serve files from storage/app/public when a public/storage symlink is not available.
     * This provides a Windows-friendly fallback so /storage/... URLs still work.
     *
     * @param Request $request
     * @param string $path
     */
    public function show(Request $request, $path)
    {
        $storageRoot = realpath(storage_path('app/public'));

        if (!$storageRoot) {
            abort(404);
        }

        // Prevent path traversal
        $requested = realpath($storageRoot . DIRECTORY_SEPARATOR . $path);

        if (!$requested || strpos($requested, $storageRoot) !== 0) {
            abort(404);
        }

        if (!is_file($requested) || !is_readable($requested)) {
            abort(404);
        }

        $mime = mime_content_type($requested) ?: 'application/octet-stream';

        return response()->file($requested, [
            'Content-Type' => $mime,
        ]);
    }
}
