<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Domain\Properties\Services\ImageService;
use App\Http\Requests\Properties\UploadFileRequest;
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
    public function upload(UploadFileRequest $request): JsonResponse
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

            // Validation handled by UploadFileRequest

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

