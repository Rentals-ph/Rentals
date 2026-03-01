<?php

use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\TestimonialController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\NewsController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrokerController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\PropertySearchController;
use App\Http\Controllers\GroqChatController;
use App\Http\Controllers\ListingAssistantController;
use Illuminate\Support\Facades\Route;

Route::get('/properties/featured', [PropertyController::class, 'featured']);
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);
Route::post('/property/search', [PropertySearchController::class, 'search']);

// Conversation management endpoints
Route::get('/property/search/suggested-prompts', [PropertySearchController::class, 'suggestedPrompts']);
Route::post('/property/search/generate-property-description', [PropertySearchController::class, 'generatePropertyDescription']);
Route::get('/property/search/conversations', [PropertySearchController::class, 'listConversations']);
Route::get('/property/search/conversation/{conversationId}', [PropertySearchController::class, 'getConversation']);
Route::delete('/property/search/conversation/{conversationId}/context', [PropertySearchController::class, 'clearConversationContext']);
Route::delete('/property/search/conversation/{conversationId}', [PropertySearchController::class, 'deleteConversation']);

// Groq AI endpoints
Route::post('/groq/chat', [GroqChatController::class, 'chat']);

// Listing Assistant endpoints (AI-powered property listing)
Route::prefix('listing/assistant')->group(function () {
    // Public endpoints (conversation can be created without auth)
    Route::post('/', [ListingAssistantController::class, 'processMessage']);
    Route::post('/new', [ListingAssistantController::class, 'startNewConversation']);
    Route::get('/{conversationId}', [ListingAssistantController::class, 'getConversation']);
    Route::post('/{conversationId}/reset', [ListingAssistantController::class, 'resetConversation']);
    Route::post('/{conversationId}/generate-description', [ListingAssistantController::class, 'generateDescription']);
    Route::post('/{conversationId}/upload-images', [ListingAssistantController::class, 'uploadImages']);
    Route::delete('/{conversationId}/images/{imageIndex}', [ListingAssistantController::class, 'deleteImage']);
    Route::patch('/{conversationId}/data', [ListingAssistantController::class, 'updateData']);
    Route::post('/{conversationId}/auto-save', [ListingAssistantController::class, 'autoSave']);
    Route::post('/{conversationId}/map-coordinates', [ListingAssistantController::class, 'saveMapCoordinates']);
    Route::post('/{conversationId}/set-field', [ListingAssistantController::class, 'setField']);
    Route::delete('/{conversationId}', [ListingAssistantController::class, 'deleteConversation']);
});

// Protected listing assistant endpoints
Route::middleware('auth:sanctum')->prefix('listing/assistant')->group(function () {
    Route::get('/conversations', [ListingAssistantController::class, 'listConversations']);
    Route::post('/{conversationId}/submit', [ListingAssistantController::class, 'submitListing']);
});

// Protected property routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::post('/properties/bulk', [PropertyController::class, 'bulkStore']);
    Route::put('/properties/{id}', [PropertyController::class, 'update']);
    Route::post('/properties/{id}', [PropertyController::class, 'update']); // Support POST with _method=PUT for FormData
    Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);
});

Route::get('/testimonials', [TestimonialController::class, 'index']);

Route::get('/blogs', [BlogController::class, 'index']);
Route::get('/blogs/{id}', [BlogController::class, 'show']);

// News endpoints
Route::get('/news', [NewsController::class, 'index']);
Route::get('/news/{id}', [NewsController::class, 'show']);

// Authentication routes (unified for agents and admins)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Email verification routes (with rate limiting)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/verify-email/send', [AuthController::class, 'sendVerificationEmail']);
});
Route::post('/verify-email/verify', [AuthController::class, 'verifyEmail']);
Route::get('/verify-email/status', [AuthController::class, 'checkVerificationStatus']);

// Agent routes
Route::get('/agents', [AgentController::class, 'index']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/agents/me', [AgentController::class, 'show']);
    Route::put('/agents/me', [AgentController::class, 'update']);
    Route::post('/agents/me', [AgentController::class, 'update']); // Support POST with _method=PUT for FormData
    Route::get('/agents/dashboard/stats', [AgentController::class, 'dashboardStats']);
});
Route::get('/agents/{id}', [AgentController::class, 'getById']);

// Admin routes (protected by authentication)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Agent/user management (no approval flow - agents are created by brokers)
    Route::get('/agents', [AdminController::class, 'getAllAgents']);
    Route::get('/agents/{id}', [AdminController::class, 'getAgentDetails']);
    
    // User CRUD
    Route::get('/users', [AdminController::class, 'getAllUsers']);
    Route::get('/users/{id}', [AdminController::class, 'getUserDetails']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
});

// Broker routes (protected by authentication)
Route::middleware('auth:sanctum')->prefix('broker')->group(function () {
    // Dashboard
    Route::get('/dashboard', [BrokerController::class, 'dashboard']);
    
    // Company management
    Route::post('/companies', [BrokerController::class, 'createCompany']);
    Route::get('/companies', [BrokerController::class, 'getCompanies']);
    
    // Team management
    Route::post('/teams', [BrokerController::class, 'createTeam']);
    Route::get('/teams', [BrokerController::class, 'getTeams']);
    Route::post('/teams/{teamId}/agents/{agentId}', [BrokerController::class, 'assignAgentToTeam']);
    Route::delete('/teams/{teamId}/agents/{agentId}', [BrokerController::class, 'removeAgentFromTeam']);
    
    // Agent management (brokers create agents directly; no approval flow)
    Route::get('/agents', [BrokerController::class, 'getAgents']);
    Route::post('/agents', [BrokerController::class, 'createAgent']);
    
    // Property management
    Route::get('/properties', [BrokerController::class, 'getProperties']);
    Route::put('/properties/{id}', [BrokerController::class, 'updateProperty']);
    
    // Subscription management
    Route::post('/subscribe', [BrokerController::class, 'subscribeToPlan']);
});

// Message routes
Route::post('/messages', [MessageController::class, 'store']); // Public - anyone can send a message
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);
});

// Page Builder routes
use App\Http\Controllers\Api\PageBuilderController;
use App\Http\Controllers\Api\UploadController;
// Public route for viewing published pages by slug
Route::get('/page/{slug}', [PageBuilderController::class, 'showBySlug']);
// Public route for getting page builder by slug (for editing)
Route::get('/page-builder/{slug}', [PageBuilderController::class, 'showBySlugPublic']);

// Protected routes for managing page builders
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/page-builder', [PageBuilderController::class, 'index']);
    Route::get('/page-builder/id/{id}', [PageBuilderController::class, 'show']);
    Route::post('/page-builder/save', [PageBuilderController::class, 'store']);
    Route::put('/page-builder/{id}', [PageBuilderController::class, 'update']);
    Route::delete('/page-builder/{id}', [PageBuilderController::class, 'destroy']);
    Route::post('/page-builder/{slug}/publish', [PageBuilderController::class, 'publishBySlug']);
    Route::post('/page-builder/id/{id}/publish', [PageBuilderController::class, 'publish']);
    Route::post('/upload', [UploadController::class, 'upload']);
});

