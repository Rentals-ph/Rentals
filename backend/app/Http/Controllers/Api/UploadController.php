<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class UploadController extends Controller
{
    /**
     * Upload an image file.
     * Accepts jpg, png, webp files up to 5MB.
     */
    public function upload(Request $request): JsonResponse
    {
        try {
            // Debug: Log request info
            Log::info('Upload request received', [
                'has_file' => $request->hasFile('file'),
                'all_files' => $request->allFiles(),
                'content_type' => $request->header('Content-Type'),
            ]);

            // Check if file was uploaded
            if (!$request->hasFile('file')) {
                Log::warning('No file in upload request');
                return response()->json([
                    'success' => false,
                    'message' => 'No file was uploaded. Please select a file.',
                ], 422);
            }

            $file = $request->file('file');
            
            // Debug: Log file info
            Log::info('File received', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
                'extension' => $file->getClientOriginalExtension(),
                'is_valid' => $file->isValid(),
                'error' => $file->isValid() ? null : $file->getErrorMessage(),
            ]);
            
            // Check if file is valid
            if (!$file->isValid()) {
                $errorMsg = $file->getErrorMessage();
                Log::error('Invalid file uploaded', ['error' => $errorMsg]);
                return response()->json([
                    'success' => false,
                    'message' => 'The uploaded file is not valid. Error: ' . $errorMsg,
                ], 422);
            }

            // Validate file type and size
            // Note: max is in kilobytes, so 5120 = 5MB
            try {
                $request->validate([
                    'file' => [
                        'required',
                        'file',
                        'mimes:jpeg,jpg,png,webp',
                        'mimetypes:image/jpeg,image/jpg,image/png,image/webp',
                        'max:5120', // 5MB max in kilobytes
                    ],
                ], [
                    'file.required' => 'Please select a file to upload.',
                    'file.file' => 'The uploaded file is not valid.',
                    'file.mimes' => 'The file must be a jpeg, jpg, png, or webp image.',
                    'file.mimetypes' => 'The file must be an image file.',
                    'file.max' => 'The file size must not exceed 5MB.',
                ]);
            } catch (ValidationException $e) {
                Log::error('Validation failed', ['errors' => $e->errors()]);
                throw $e;
            }

            // Use ImageService for consistent upload handling
            $path = ImageService::upload($file, 'page-builder');
            
            if (!$path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to store the uploaded file.',
                ], 500);
            }
            
            $url = ImageService::url($path);

            return response()->json([
                'success' => true,
                'url' => $url,
                'path' => $path,
            ]);
        } catch (ValidationException $e) {
            Log::error('Upload validation error: ' . json_encode($e->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Validation failed: ' . implode(', ', array_map(function ($errors) {
                    return implode(', ', $errors);
                }, $e->errors())),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error uploading file: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload file: ' . $e->getMessage(),
            ], 500);
        }
    }
}

