<?php

namespace App\Http\Controllers\Api\Shared;

use App\Http\Controllers\Controller;
use App\Models\Downloadable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DownloadableController extends Controller
{
    /**
     * Get all active downloadables (public route for agents/brokers)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $category = $request->query('category');
            
            $query = Downloadable::where('is_active', true);
            
            if ($category) {
                $query->where('category', $category);
            }
            
            $downloadables = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $downloadables,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // If table doesn't exist, return empty array instead of error
            if (str_contains($e->getMessage(), "doesn't exist")) {
                \Log::warning('Downloadables table does not exist. Please run migrations.');
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }
            throw $e;
        }
    }

    /**
     * Get all downloadables (admin only)
     */
    public function getAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        try {
            $category = $request->query('category');
            
            $query = Downloadable::query();
            
            if ($category) {
                $query->where('category', $category);
            }
            
            $downloadables = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $downloadables,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // If table doesn't exist, return empty array instead of error
            if (str_contains($e->getMessage(), "doesn't exist")) {
                \Log::warning('Downloadables table does not exist. Please run migrations.');
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }
            throw $e;
        }
    }

    /**
     * Get a specific downloadable
     */
    public function show(int $id): JsonResponse
    {
        $downloadable = Downloadable::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $downloadable,
        ]);
    }

    /**
     * Create a new downloadable (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:51200', // Max 50MB (in KB)
            'category' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!$request->hasFile('file')) {
            return response()->json([
                'success' => false,
                'message' => 'No file uploaded',
                'errors' => ['file' => ['The file field is required.']],
            ], 422);
        }

        $file = $request->file('file');
        
        // Check if file upload was successful
        if (!$file->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
                'errors' => ['file' => ['The file failed to upload. Error: ' . $file->getError()]],
            ], 422);
        }

        $originalName = $file->getClientOriginalName();
        $fileName = Str::random(40) . '_' . time() . '.' . $file->getClientOriginalExtension();
        
        // Store file in public storage
        try {
            $storedPath = $file->storeAs('downloadables', $fileName, 'public');
            
            if (!$storedPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to store file',
                ], 500);
            }
        } catch (\Exception $e) {
            \Log::error('File storage error', [
                'error' => $e->getMessage(),
                'file_name' => $originalName,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to store file: ' . $e->getMessage(),
            ], 500);
        }

        $downloadable = Downloadable::create([
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $storedPath,
            'file_name' => $originalName,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'category' => $request->category,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Downloadable created successfully',
            'data' => $downloadable,
        ], 201);
    }

    /**
     * Update a downloadable (admin only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        $downloadable = Downloadable::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'sometimes|file|max:51200', // Max 50MB (in KB)
            'category' => 'nullable|string|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $updateData = $request->only(['title', 'description', 'category', 'is_active']);

        // Handle file update if provided
        if ($request->hasFile('file')) {
            // Delete old file
            if (Storage::disk('public')->exists($downloadable->file_path)) {
                Storage::disk('public')->delete($downloadable->file_path);
            }

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $fileName = Str::random(40) . '_' . time() . '.' . $file->getClientOriginalExtension();
            $storedPath = $file->storeAs('downloadables', $fileName, 'public');
            
            $updateData['file_path'] = $storedPath;
            $updateData['file_name'] = $originalName;
            $updateData['file_type'] = $file->getMimeType();
            $updateData['file_size'] = $file->getSize();
        }

        $downloadable->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Downloadable updated successfully',
            'data' => $downloadable->fresh(),
        ]);
    }

    /**
     * Delete a downloadable (admin only)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.',
            ], 403);
        }

        $downloadable = Downloadable::findOrFail($id);

        // Delete file from storage
        if (Storage::disk('public')->exists($downloadable->file_path)) {
            Storage::disk('public')->delete($downloadable->file_path);
        }

        $downloadable->delete();

        return response()->json([
            'success' => true,
            'message' => 'Downloadable deleted successfully',
        ]);
    }

    /**
     * Download a file (public route for agents/brokers)
     */
    public function download(int $id): \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
    {
        try {
            $downloadable = Downloadable::where('id', $id)
                ->where('is_active', true)
                ->firstOrFail();

            // Try multiple possible file paths
            $filePath = storage_path('app/public/' . $downloadable->file_path);
            
            // If file doesn't exist, try with Storage facade
            if (!file_exists($filePath)) {
                if (Storage::disk('public')->exists($downloadable->file_path)) {
                    // Use Storage to get the file
                    $filePath = Storage::disk('public')->path($downloadable->file_path);
                } else {
                    \Log::error('Downloadable file not found', [
                        'id' => $id,
                        'file_path' => $downloadable->file_path,
                        'storage_path' => $filePath,
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'File not found',
                    ], 404);
                }
            }

            if (!file_exists($filePath)) {
                \Log::error('Downloadable file does not exist', [
                    'id' => $id,
                    'file_path' => $downloadable->file_path,
                    'checked_path' => $filePath,
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'File not found on server',
                ], 404);
            }

            // Increment download count
            $downloadable->incrementDownloadCount();

            return response()->download($filePath, $downloadable->file_name, [
                'Content-Type' => $downloadable->file_type ?? 'application/octet-stream',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Downloadable not found',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error downloading file', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to download file: ' . $e->getMessage(),
            ], 500);
        }
    }
}

