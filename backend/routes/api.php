<?php

use App\Http\Controllers\Api\Public\PropertyController;
use App\Http\Controllers\Api\Public\TestimonialController;
use App\Http\Controllers\Api\Public\BlogController;
use App\Http\Controllers\Api\Public\NewsController;
use App\Http\Controllers\Api\Agent\AgentController;
use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Public\AuthController;
use App\Http\Controllers\Api\Broker\BrokerController;
use App\Http\Controllers\Api\Public\MessageController;
use App\Http\Controllers\Api\Public\ContactController;
use App\Http\Controllers\Api\Properties\PropertySearchController;
use App\Http\Controllers\Api\AI\GroqChatController;
use App\Http\Controllers\Api\AI\ListingAssistantController;
use App\Http\Controllers\Api\Public\PageBuilderController;
use App\Http\Controllers\Api\Public\UploadController;
use App\Http\Controllers\Api\Tenant\TenantAuthController;
use App\Http\Controllers\Api\Tenant\ChatRoomController;
use App\Http\Controllers\Api\Tenant\ReviewController;
use App\Http\Controllers\Api\Tenant\SavedPropertyController;
use App\Http\Controllers\Api\Tenant\NotificationController;
use App\Http\Controllers\Api\Analytics\PropertyViewController;
use App\Http\Controllers\Api\Analytics\ProfileViewController;
use App\Http\Controllers\Api\Analytics\BlogViewController;
use App\Http\Controllers\Api\Analytics\BlogLikeController;
use App\Http\Controllers\Api\Analytics\BlogCommentController;
use App\Http\Controllers\Api\Analytics\BlogCommentLikeController;
use App\Http\Controllers\Api\Analytics\NewsViewController;
use App\Http\Controllers\Api\Analytics\NewsLikeController;
use App\Http\Controllers\Api\Analytics\NewsCommentController;
use App\Http\Controllers\Api\Public\DownloadableController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
Route::get('/properties/featured', [PropertyController::class, 'featured']);
Route::get('/properties', [PropertyController::class, 'index']);
// Primary: /properties/{slug}  — also accepts numeric IDs for backward compat
Route::get('/properties/{slug}', [PropertyController::class, 'show']);
Route::post('/property/search', [PropertySearchController::class, 'search']);

// Conversation management endpoints
Route::get('/property/search/suggested-prompts', [PropertySearchController::class, 'suggestedPrompts']);
Route::get('/property/search/queries', [PropertySearchController::class, 'propertySearchQueries']);
Route::post('/property/search/generate-property-description', [PropertySearchController::class, 'generatePropertyDescription']);
Route::get('/property/search/conversations', [PropertySearchController::class, 'listConversations']);
Route::get('/property/search/conversation/{conversationId}', [PropertySearchController::class, 'getConversation']);
Route::delete('/property/search/conversation/{conversationId}/context', [PropertySearchController::class, 'clearConversationContext']);
Route::delete('/property/search/conversation/{conversationId}', [PropertySearchController::class, 'deleteConversation']);

// Groq AI endpoints
Route::post('/groq/chat', [GroqChatController::class, 'chat']);

// Listing Assistant endpoints (SIMPLIFIED FOR SEARCH - Set B Phase 2)
// Kept endpoints: getConversation, deleteConversation, listConversations
// Removed endpoints: see set-b-phase-1-audit.md section 3
Route::prefix('listing/assistant')->group(function () {
    // Public endpoints (conversation can be created without auth)
    // REMOVED IN SEARCH REFACTOR: processMessage - use /property/search instead
    // Route::post('/', [ListingAssistantController::class, 'processMessage']);
    
    // REMOVED IN SEARCH REFACTOR: startNewConversation - use /property/search with no conversation_id
    // Route::post('/new', [ListingAssistantController::class, 'startNewConversation']);
    
    // KEPT: Load conversation history
    Route::get('/{conversationId}', [ListingAssistantController::class, 'getConversation']);
    
    // REMOVED IN SEARCH REFACTOR: resetConversation - handled client-side
    // Route::post('/{conversationId}/reset', [ListingAssistantController::class, 'resetConversation']);
    
    // REMOVED IN SEARCH REFACTOR: generateDescription - not property creation
    // Route::post('/{conversationId}/generate-description', [ListingAssistantController::class, 'generateDescription']);
    
    // REMOVED IN SEARCH REFACTOR: uploadImages - not property creation
    // Route::post('/{conversationId}/upload-images', [ListingAssistantController::class, 'uploadImages']);
    
    // REMOVED IN SEARCH REFACTOR: deleteImage - not property creation
    // Route::delete('/{conversationId}/images/{imageIndex}', [ListingAssistantController::class, 'deleteImage']);
    
    // REMOVED IN SEARCH REFACTOR: updateData - not property creation
    // Route::patch('/{conversationId}/data', [ListingAssistantController::class, 'updateData']);
    
    // REMOVED IN SEARCH REFACTOR: autoSave - not property creation
    // Route::post('/{conversationId}/auto-save', [ListingAssistantController::class, 'autoSave']);
    
    // REMOVED IN SEARCH REFACTOR: saveMapCoordinates - not property creation
    // Route::post('/{conversationId}/map-coordinates', [ListingAssistantController::class, 'saveMapCoordinates']);
    
    // REMOVED IN SEARCH REFACTOR: setField - not property creation
    // Route::post('/{conversationId}/set-field', [ListingAssistantController::class, 'setField']);
    
    // KEPT: Delete conversation
    Route::delete('/{conversationId}', [ListingAssistantController::class, 'deleteConversation']);
});

// Protected listing assistant endpoints (SIMPLIFIED)
Route::middleware('auth:sanctum')->prefix('listing/assistant')->group(function () {
    // KEPT: List user conversations
    Route::get('/conversations', [ListingAssistantController::class, 'listConversations']);
    
    // REMOVED IN SEARCH REFACTOR: submitListing - not property creation
    // Route::post('/{conversationId}/submit', [ListingAssistantController::class, 'submitListing']);
});

// Protected property routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::post('/properties/bulk', [PropertyController::class, 'bulkStore']);
    Route::put('/properties/{slug}', [PropertyController::class, 'update']);
    Route::post('/properties/{slug}', [PropertyController::class, 'update']); // POST alias for FormData
    Route::delete('/properties/{slug}', [PropertyController::class, 'destroy']);
});

Route::get('/testimonials', [TestimonialController::class, 'index']);

Route::get('/blogs', [BlogController::class, 'index']);
// Primary: /blogs/{slug}  — also accepts numeric IDs for backward compat
Route::get('/blogs/{slug}', [BlogController::class, 'show']);

// Protected blog routes (admin only)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/blogs', [BlogController::class, 'store']);
    Route::put('/blogs/{slug}', [BlogController::class, 'update']);
    Route::delete('/blogs/{slug}', [BlogController::class, 'destroy']);
});

// News endpoints
Route::get('/news', [NewsController::class, 'index']);
// Primary: /news/{slug}  — also accepts numeric IDs for backward compat
Route::get('/news/{slug}', [NewsController::class, 'show']);

// Protected news routes (admin only)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/news', [NewsController::class, 'store']);
    Route::put('/news/{slug}', [NewsController::class, 'update']);
    Route::delete('/news/{slug}', [NewsController::class, 'destroy']);
});

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
    Route::post('/agents/team-invitations/{messageId}/accept', [AgentController::class, 'acceptTeamInvitation']);
    Route::post('/agents/team-invitations/{messageId}/reject', [AgentController::class, 'rejectTeamInvitation']);
});
// Primary: /agents/{slug}  — also accepts numeric IDs for backward compat
Route::get('/agents/{identifier}', [AgentController::class, 'getById']);

// Admin routes (protected by authentication)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Agent/user management (no approval flow - agents are created by brokers)
    Route::get('/agents', [AdminController::class, 'getAllAgents']);
    Route::get('/agents/{id}', [AdminController::class, 'getAgentDetails']);
    Route::post('/agents', [AdminController::class, 'createUser']); // Create agent via user endpoint
    Route::put('/agents/{id}', [AdminController::class, 'updateUser']); // Update agent via user endpoint
    Route::delete('/agents/{id}', [AdminController::class, 'deleteUser']); // Delete agent via user endpoint
    
    // User CRUD
    Route::get('/users', [AdminController::class, 'getAllUsers']);
    Route::get('/users/{id}', [AdminController::class, 'getUserDetails']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
    
    // Property CRUD
    Route::get('/properties', [AdminController::class, 'getAllProperties']);
    Route::get('/properties/{identifier}', [AdminController::class, 'getPropertyDetails']);
    Route::post('/properties', [AdminController::class, 'createProperty']);
    Route::put('/properties/{identifier}', [AdminController::class, 'updateProperty']);
    Route::post('/properties/{identifier}', [AdminController::class, 'updateProperty']); // POST alias for FormData
    Route::delete('/properties/{identifier}', [AdminController::class, 'deleteProperty']);
    
    // Contact inquiries management
    Route::get('/contact-inquiries', [ContactController::class, 'index']);
    Route::get('/contact-inquiries/{id}', [ContactController::class, 'show']);
    Route::post('/contact-inquiries/{id}/read', [ContactController::class, 'markAsRead']);
    Route::delete('/contact-inquiries/{id}', [ContactController::class, 'destroy']);
});

// Public company profile — /companies/{slug} or /companies/{id}
Route::get('/companies/{identifier}', [BrokerController::class, 'showCompany']);

// Broker routes (protected by authentication)
Route::middleware('auth:sanctum')->prefix('broker')->group(function () {
    // Profile management (uses AgentController since brokers are also Users)
    Route::get('/me', [AgentController::class, 'show']);
    Route::put('/me', [AgentController::class, 'update']);
    Route::post('/me', [AgentController::class, 'update']); // Support POST with _method=PUT for FormData
    Route::get('/dashboard/stats', [AgentController::class, 'dashboardStats']);
    
    // Dashboard
    Route::get('/dashboard', [BrokerController::class, 'dashboard']);
    
    // Company management
    Route::post('/companies', [BrokerController::class, 'createCompany']);
    Route::get('/companies', [BrokerController::class, 'getCompanies']);
    Route::put('/companies/{identifier}', [BrokerController::class, 'updateCompany']);
    Route::post('/companies/{identifier}', [BrokerController::class, 'updateCompany']); // POST alias
    
    // Team management
    Route::post('/teams', [BrokerController::class, 'createTeam']);
    Route::get('/teams', [BrokerController::class, 'getTeams']);
    Route::put('/teams/{teamId}', [BrokerController::class, 'updateTeam']);
    Route::delete('/teams/{teamId}', [BrokerController::class, 'deleteTeam']);
    Route::post('/teams/{teamId}/agents/{agentId}', [BrokerController::class, 'assignAgentToTeam']);
    Route::delete('/teams/{teamId}/agents/{agentId}', [BrokerController::class, 'removeAgentFromTeam']);
    
    // Agent management (brokers create agents directly; no approval flow)
    Route::get('/agents/search', [BrokerController::class, 'searchAgentsToInvite']);
    Route::post('/agents/invite', [BrokerController::class, 'inviteAgent']);
    Route::get('/agents', [BrokerController::class, 'getAgents']);
    Route::post('/agents', [BrokerController::class, 'createAgent']);
    
    // Property management
    Route::get('/properties', [BrokerController::class, 'getProperties']);
    Route::put('/properties/{id}', [BrokerController::class, 'updateProperty']);

    // Reports
    Route::get('/reports/team-productivity', [BrokerController::class, 'teamProductivityReport']);
    Route::get('/reports/property-type-distribution', [BrokerController::class, 'getPropertyTypeDistribution']);
    Route::get('/reports/location-performance', [BrokerController::class, 'getLocationPerformance']);
    Route::get('/reports/conversion-stats', [BrokerController::class, 'getConversionAndResponseStats']);
    
    // Subscription management
    Route::post('/subscribe', [BrokerController::class, 'subscribeToPlan']);
});

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY STATUS
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::patch('/properties/{slug}/status', [PropertyController::class, 'updateStatus']);
});

// Contact inquiry routes (public)
Route::post('/contact', [ContactController::class, 'submit']);

// Message routes
Route::post('/messages', [MessageController::class, 'store']); // Public - anyone can send a message
Route::get('/messages/customer/{email}', [MessageController::class, 'getCustomerInquiries']); // Public - get customer inquiries by email
Route::get('/conversations/{id}/messages', [MessageController::class, 'getConversationMessages']); // Public - get conversation messages (with email param for customers)
Route::put('/conversations/{id}/mark-read', [MessageController::class, 'markConversationAsReadForCustomer']); // Public - mark conversation as read for customer

// Protected conversation routes (agent/broker only)
Route::middleware('auth:sanctum')->group(function () {
    Route::delete('/conversations/{id}', [MessageController::class, 'deleteConversation']); // Delete conversation
});
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
    Route::put('/messages/{id}/read', [MessageController::class, 'markAsRead']);
    Route::put('/messages/read-all', [MessageController::class, 'markAllAsRead']);
    Route::post('/messages/{id}/reply', [MessageController::class, 'reply']); // Reply to a message
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);
});

// Page Builder routes
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

// =============================================================================
// TWO-TIER TENANT SYSTEM
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// Guest sessions (Tier 1)
// ─────────────────────────────────────────────────────────────────────────────
// Start / retrieve a guest session; returns a browser token
Route::post('/tenant/guest/session', [TenantAuthController::class, 'startGuestSession']);

// ─────────────────────────────────────────────────────────────────────────────
// Tenant registration & email verification (Tier 2)
// Reuses the same /verify-email/* flow already in place for brokers.
// ─────────────────────────────────────────────────────────────────────────────
Route::post('/tenant/register', [TenantAuthController::class, 'register']);

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated tenant routes
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('tenant')->group(function () {
    // Profile
    Route::get('/me', [TenantAuthController::class, 'me']);
    Route::put('/me', [TenantAuthController::class, 'updateProfile']);
    Route::post('/me', [TenantAuthController::class, 'updateProfile']); // POST alias for FormData

    // Upgrade / merge a guest session into this tenant account
    Route::post('/upgrade-guest', [TenantAuthController::class, 'upgradeGuest']);

    // Saved properties
    Route::get('/saved-properties', [SavedPropertyController::class, 'index']);
    Route::post('/saved-properties/{propertyId}/toggle', [SavedPropertyController::class, 'toggle']);
    Route::get('/saved-properties/{propertyId}', [SavedPropertyController::class, 'check']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Chat — guest.session middleware runs on ALL chat routes so both
//         registered users (sanctum) and guests (X-Guest-Token) work.
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('guest.session')->prefix('chat')->group(function () {
    // Inbox (all rooms for this user/guest)
    Route::get('/rooms', [ChatRoomController::class, 'index']);

    // Find or create a room for a property
    Route::post('/rooms', [ChatRoomController::class, 'findOrCreate']);

    // Messages within a room
    Route::get('/rooms/{roomId}/messages', [ChatRoomController::class, 'messages']);
    Route::post('/rooms/{roomId}/messages', [ChatRoomController::class, 'sendMessage']);
    Route::put('/rooms/{roomId}/read', [ChatRoomController::class, 'markRead']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────────────────────

// Public read — anyone can view approved reviews
Route::get('/properties/{id}/reviews', [ReviewController::class, 'forProperty']);
Route::get('/agents/{id}/reviews', [ReviewController::class, 'forAgent']);

// Write — registered tenant or guest (guest.session runs to attach session)
Route::middleware('guest.session')->group(function () {
    Route::post('/properties/{id}/reviews', [ReviewController::class, 'submitForProperty']);
});

// Agent reviews require tenant auth
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/agents/{id}/reviews', [ReviewController::class, 'submitForAgent']);
});

// Admin moderation
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/reviews/pending', [ReviewController::class, 'pendingReviews']);
    Route::put('/reviews/{id}/moderate', [ReviewController::class, 'moderate']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Notifications — registered users only (tenants, agents, brokers)
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
});

// =============================================================================
// ANALYTICS & ENGAGEMENT
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// Property views
// guest.session middleware attaches a GuestSession (creates one if absent) so
// all visitors — registered, guest-session, or anonymous — can be tracked.
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('guest.session')->group(function () {
    Route::post('/properties/{property}/views', [PropertyViewController::class, 'record']);
    Route::get('/properties/{property}/views',  [PropertyViewController::class, 'count']);

    // ─────────────────────────────────────────────────────────────────────────
    // Agent / Broker profile views
    // ─────────────────────────────────────────────────────────────────────────
    Route::post('/agents/{user}/views', [ProfileViewController::class, 'record']);
    Route::get('/agents/{user}/views',  [ProfileViewController::class, 'count']);

    // ─────────────────────────────────────────────────────────────────────────
    // Blog engagement
    // ─────────────────────────────────────────────────────────────────────────
    Route::post('/blogs/{blog}/views',    [BlogViewController::class, 'record']);
    Route::get('/blogs/{blog}/views',     [BlogViewController::class, 'count']);

    Route::get('/blogs/{blog}/likes',     [BlogLikeController::class, 'show']);
    // Rate limit likes: 10 likes per minute per user/guest session
    Route::post('/blogs/{blog}/likes',    [BlogLikeController::class, 'toggle'])->middleware('throttle:10,1');

    Route::get('/blogs/{blog}/comments',  [BlogCommentController::class, 'index']);
    Route::post('/blogs/{blog}/comments', [BlogCommentController::class, 'store'])->middleware('throttle:5,1');
    
    Route::get('/blogs/{blog}/comments/{comment}/likes',  [BlogCommentLikeController::class, 'show']);
    // Rate limit comment likes: 10 likes per minute per user/guest session
    Route::post('/blogs/{blog}/comments/{comment}/likes', [BlogCommentLikeController::class, 'toggle'])->middleware('throttle:10,1');

    // ─────────────────────────────────────────────────────────────────────────
    // News engagement
    // ─────────────────────────────────────────────────────────────────────────
    Route::post('/news/{news}/views',    [NewsViewController::class, 'record']);
    Route::get('/news/{news}/views',     [NewsViewController::class, 'count']);

    Route::get('/news/{news}/likes',     [NewsLikeController::class, 'show']);
    Route::post('/news/{news}/likes',    [NewsLikeController::class, 'toggle']);

    Route::get('/news/{news}/comments',  [NewsCommentController::class, 'index']);
    Route::post('/news/{news}/comments', [NewsCommentController::class, 'store']);
});

// ─────────────────────────────────────────────────────────────────────────────
// Comment deletion — authenticated users (own comment) or admin/moderator
// ─────────────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::delete('/blogs/{blog}/comments/{comment}', [BlogCommentController::class, 'destroy']);
    Route::delete('/news/{news}/comments/{comment}',  [NewsCommentController::class, 'destroy']);
});

// Admin / Moderator — delete any comment (explicit admin prefix keeps parity with existing admin routes)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::delete('/blogs/{blog}/comments/{comment}', [BlogCommentController::class, 'destroy']);
    Route::delete('/news/{news}/comments/{comment}',  [NewsCommentController::class, 'destroy']);
});

// Downloadables routes
// Public route for agents/brokers to get active downloadables
Route::get('/downloadables', [DownloadableController::class, 'index']);
// Public route for downloading files
Route::get('/downloadables/{id}/download', [DownloadableController::class, 'download']);

// Admin routes for managing downloadables
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/downloadables', [DownloadableController::class, 'getAll']);
    Route::post('/downloadables', [DownloadableController::class, 'store']);
    Route::get('/downloadables/{id}', [DownloadableController::class, 'show']);
    Route::put('/downloadables/{id}', [DownloadableController::class, 'update']);
    Route::delete('/downloadables/{id}', [DownloadableController::class, 'destroy']);
});
});
