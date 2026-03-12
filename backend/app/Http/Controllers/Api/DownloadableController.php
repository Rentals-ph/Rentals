<?php

namespace App\Http\Controllers\Api;

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
            'file' => 'required|file|max:10240', // Max 10MB
            'category' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $fileName = Str::random(40) . '_' . time() . '.' . $file->getClientOriginalExtension();
        $filePath = 'downloadables/' . $fileName;
        
        // Store file in public storage
        $storedPath = $file->storeAs('downloadables', $fileName, 'public');
        
        if (!$storedPath) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload file',
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
            'file' => 'sometimes|file|max:10240',
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
        $downloadable = Downloadable::where('id', $id)
            ->where('is_active', true)
            ->firstOrFail();

        $filePath = storage_path('app/public/' . $downloadable->file_path);
        
        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        // Increment download count
        $downloadable->incrementDownloadCount();

        return response()->download($filePath, $downloadable->file_name);
    }
}

