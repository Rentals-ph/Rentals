<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Public\PageBuilderController;
use App\Http\Controllers\Api\Public\StorageController;

Route::get('/', function () {
    return response()->json(['message' => 'Rentals.ph API']);
});

// Public page builder route - accessible at /page/{slug}
Route::get('/page/{slug}', [PageBuilderController::class, 'show']);

// Fallback route to serve storage files when public/storage symlink isn't present (Windows friendly)
Route::get('storage/{path}', [StorageController::class, 'show'])->where('path', '.*');
