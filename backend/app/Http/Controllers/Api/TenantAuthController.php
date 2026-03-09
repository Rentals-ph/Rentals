<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuestSession;
use App\Models\TenantProfile;
use App\Models\User;
use App\Mail\EmailVerificationMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Handles Tier-1 (guest) session creation and
 * Tier-2 (registered tenant) registration + guest→tenant upgrade.
 */
class TenantAuthController extends Controller
{
    // =========================================================================
    // Tier 1 — Guest session
    // =========================================================================

    /**
     * Start (or retrieve) a guest session.
     * Called when an unauthenticated user submits their name + email to start
     * a chat. Returns a browser token the front-end stores in a cookie.
     *
     * POST /tenant/guest/session
     */
    public function startGuestSession(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name'  => 'required|string|max:255',
                'email' => 'required|string|email|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $email = strtolower(trim($request->email));

            // If the email already belongs to a registered user, tell the
            // front-end so it can redirect to login instead.
            if (User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
                return response()->json([
                    'success'  => false,
                    'message'  => 'An account with this email already exists. Please log in.',
                    'redirect' => 'login',
                ], 409);
            }

            // Re-use an existing un-merged session for the same email.
            $session = GuestSession::where('email', $email)
                ->where('is_merged', false)
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
                })
                ->first();

            if (!$session) {
                $session = GuestSession::create([
                    'token'          => Str::random(80),
                    'name'           => trim($request->name),
                    'email'          => $email,
                    'last_active_at' => now(),
                ]);
            } else {
                // Update name in case it changed
                $session->update([
                    'name'           => trim($request->name),
                    'last_active_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Guest session started',
                'data'    => [
                    'token' => $session->token,
                    'name'  => $session->name,
                    'email' => $session->email,
                ],
            ], 200);

        } catch (\Exception $e) {
            \Log::error('startGuestSession error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to start guest session. Please try again.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // =========================================================================
    // Tier 2 — Tenant registration
    // =========================================================================

    /**
     * Register a new tenant.
     * Requires prior email verification (same flow used for broker registration).
     * If a guest_token is provided, the guest session is merged into the new account.
     *
     * POST /tenant/register
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name'        => 'required|string|max:255',
                'email'       => 'required|string|email|max:255|unique:users,email',
                'password'    => 'required|string|min:8|confirmed',
                'guest_token' => 'nullable|string|max:80',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $email = strtolower(trim($request->email));

            // ── Email verification check ──────────────────────────────────────
            $isVerified = DB::table('verified_emails')
                ->where('email', $email)
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
                })
                ->exists();

            if (!$isVerified) {
                $isVerified = cache()->has('verified_email_' . $email);
            }

            if (!$isVerified) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please verify your email address before registering.',
                ], 422);
            }

            // ── Resolve optional guest session ────────────────────────────────
            $guestSession = null;
            if ($request->filled('guest_token')) {
                $guestSession = GuestSession::findByToken($request->guest_token);
                // Guest token email must match registration email for merge
                if ($guestSession && $guestSession->email !== $email) {
                    $guestSession = null;
                }
            }

            // ── Create user ───────────────────────────────────────────────────
            $nameParts = explode(' ', trim($request->name), 2);
            $firstName = $nameParts[0];
            $lastName  = count($nameParts) > 1 ? $nameParts[1] : '';

            $user = DB::transaction(function () use ($firstName, $lastName, $email, $request, $guestSession) {

                $user = User::create([
                    'first_name' => $firstName,
                    'last_name'  => $lastName,
                    'email'      => $email,
                    'password'   => Hash::make($request->password),
                    'role'       => 'tenant',
                    'status'     => 'approved',
                    'verified'   => true,
                    'is_active'  => true,
                ]);

                // Create tenant profile automatically
                TenantProfile::create(['user_id' => $user->id]);

                // ── Merge guest session ───────────────────────────────────────
                if ($guestSession) {
                    $this->mergeGuestSession($guestSession, $user);
                }

                return $user;
            });

            // ── Clean up verification records ─────────────────────────────────
            DB::table('verified_emails')->where('email', $email)->delete();
            cache()->forget('verified_email_' . $email);

            // ── Issue Sanctum token ───────────────────────────────────────────
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Tenant registration successful!',
                'data'    => [
                    'token'      => $token,
                    'token_type' => 'Bearer',
                    'user'       => [
                        'id'         => $user->id,
                        'first_name' => $user->first_name,
                        'last_name'  => $user->last_name,
                        'email'      => $user->email,
                        'role'       => $user->role,
                    ],
                ],
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Tenant registration DB error: ' . $e->getMessage(), [
                'sql'      => $e->getSql(),
                'bindings' => $e->getBindings(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed due to a database error.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);

        } catch (\Exception $e) {
            \Log::error('Tenant registration error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Upgrade an existing guest session to a registered tenant account.
     * Only valid when called by an already-authenticated tenant (edge case:
     * user registered on another device and wants to claim a guest session).
     *
     * POST /tenant/upgrade-guest
     */
    public function upgradeGuest(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user || !$user->isTenant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant authentication required.',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'guest_token' => 'required|string|max:80',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $guestSession = GuestSession::findByToken($request->guest_token);

            if (!$guestSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guest session not found or already merged.',
                ], 404);
            }

            if ($guestSession->email !== strtolower($user->email)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guest session email does not match your account.',
                ], 422);
            }

            DB::transaction(function () use ($guestSession, $user) {
                $this->mergeGuestSession($guestSession, $user);
            });

            return response()->json([
                'success' => true,
                'message' => 'Guest session merged into your account successfully.',
            ], 200);

        } catch (\Exception $e) {
            \Log::error('upgradeGuest error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upgrade guest session.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Retrieve the authenticated tenant's profile.
     * GET /tenant/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->isTenant()) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant authentication required.',
            ], 403);
        }

        $user->load('tenantProfile');

        return response()->json([
            'success' => true,
            'data'    => [
                'id'             => $user->id,
                'first_name'     => $user->first_name,
                'last_name'      => $user->last_name,
                'email'          => $user->email,
                'phone'          => $user->phone,
                'role'           => $user->role,
                'tenant_profile' => $user->tenantProfile,
            ],
        ]);
    }

    /**
     * Update the authenticated tenant's profile.
     * PUT /tenant/me
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user || !$user->isTenant()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant authentication required.',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'first_name'              => 'sometimes|string|max:255',
                'last_name'               => 'sometimes|string|max:255',
                'phone'                   => 'nullable|string|max:20',
                'preferred_move_in_date'  => 'nullable|date',
                'budget_min'              => 'nullable|numeric|min:0',
                'budget_max'              => 'nullable|numeric|min:0|gte:budget_min',
                'preferred_locations'     => 'nullable|array',
                'preferred_locations.*'   => 'string|max:100',
                'lifestyle_notes'         => 'nullable|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            DB::transaction(function () use ($request, $user) {
                // Update user fields
                $userFields = array_filter($request->only(['first_name', 'last_name', 'phone']));
                if (!empty($userFields)) {
                    $user->update($userFields);
                }

                // Update / create tenant profile fields
                $profileFields = array_filter(
                    $request->only([
                        'preferred_move_in_date',
                        'budget_min',
                        'budget_max',
                        'preferred_locations',
                        'lifestyle_notes',
                    ]),
                    fn ($v) => $v !== null
                );

                if (!empty($profileFields)) {
                    $user->tenantProfile()->updateOrCreate(
                        ['user_id' => $user->id],
                        $profileFields
                    );
                }
            });

            $user->load('tenantProfile');

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully.',
                'data'    => $user,
            ]);

        } catch (\Exception $e) {
            \Log::error('updateProfile error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Transfer all guest data to a registered user and invalidate the session.
     */
    private function mergeGuestSession(GuestSession $guest, User $user): void
    {
        // Transfer chat rooms: replace guest_session_id with user_id
        DB::table('chat_rooms')
            ->where('guest_session_id', $guest->id)
            ->whereNull('user_id')
            ->update([
                'user_id'          => $user->id,
                'guest_session_id' => null,
            ]);

        // Transfer chat message sender records
        DB::table('chat_messages')
            ->where('sender_type', 'guest_session')
            ->where('sender_id', $guest->id)
            ->update([
                'sender_type' => 'user',
                'sender_id'   => $user->id,
            ]);

        // Transfer reviews
        DB::table('reviews')
            ->where('reviewer_type', 'guest_session')
            ->where('reviewer_id', $guest->id)
            ->update([
                'reviewer_type'  => 'user',
                'reviewer_id'    => $user->id,
                // Keep reviewer_name / reviewer_email for display history
            ]);

        // Mark guest session as merged
        $guest->update([
            'is_merged'           => true,
            'merged_into_user_id' => $user->id,
            'expires_at'          => now(),
        ]);
    }
}

