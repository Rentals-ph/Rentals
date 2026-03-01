<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\EmailVerificationMail;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    /**
     * Register a new user (simplified - only requires LR email and password).
     */
    #[OA\Post(
        path: "/register",
        summary: "Register a new user with LR email account",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["email", "password"],
                    properties: [
                        new OA\Property(property: "email", type: "string", format: "email", maxLength: 255, description: "LR Email Account"),
                        new OA\Property(property: "password", type: "string", minLength: 8, description: "User's password"),
                        new OA\Property(property: "name", type: "string", maxLength: 255, description: "User's name"),
                        new OA\Property(property: "role", type: "string", enum: ["agent", "broker"], description: "User's role"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "User registered successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Registration successful!"),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "email", type: "string", example: "user@example.com"),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
            ),
            new OA\Response(
                response: 500,
                description: "Server error",
            ),
        ]
    )]
    public function register(Request $request): JsonResponse
    {
        try {
            // Validate the request data
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => 'required|string|min:8',
                'name' => 'nullable|string|max:255',
                'role' => 'nullable|string|in:broker', // Agents are created by brokers; no self-registration
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Normalize email for consistent verification check (define before using!)
            $emailForRegistration = strtolower(trim($request->email));

            // Check if email is verified (check database first, then cache)
            $verifiedEmail = DB::table('verified_emails')
                ->where('email', $emailForRegistration)
                ->where(function($query) {
                    $query->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                })
                ->first();
            
            $isVerified = $verifiedEmail !== null;
            
            // Also check cache as fallback
            if (!$isVerified) {
                $isVerified = cache()->has('verified_email_' . $emailForRegistration);
            }
            
            if (!$isVerified) {
                \Log::warning('Registration attempted with unverified email', [
                    'email' => $request->email,
                    'normalized_email' => $emailForRegistration,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Please verify your email address before registering',
                ], 422);
            }

            // TODO: Add LR email validation here
            // For now, we'll just validate the email format
            // You can add integration with LR system to verify the email exists
            
            // Extract name from request or email
            $name = $request->name ?? '';
            $nameParts = $name ? explode(' ', trim($name), 2) : [];
            $firstName = !empty($nameParts) ? $nameParts[0] : '';
            $lastName = !empty($nameParts) && count($nameParts) > 1 ? $nameParts[1] : '';
            
            // If no name provided, extract from email
            if (empty($firstName)) {
                $emailParts = explode('@', $emailForRegistration);
                $firstName = $emailParts[0];
            }

            // Only brokers can self-register; agents are created by brokers
            $role = $request->role ?? 'broker';
            if ($role !== 'broker') {
                $role = 'broker';
            }

            // Create the user with provided fields (use normalized email)
            $userData = [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $emailForRegistration,
                'password' => Hash::make($request->password),
                'role' => $role,
                'status' => 'approved', // Auto-approve for simplified registration
                'verified' => true, // Auto-verify for LR email accounts
                'is_active' => true,
            ];
            
            // Add name field if the column exists (for backward compatibility)
            if (Schema::hasColumn('users', 'name')) {
                $userData['name'] = trim($firstName . ' ' . $lastName);
            }
            
            $user = User::create($userData);

            // Clean up verification records after successful registration
            DB::table('verified_emails')
                ->where('email', $emailForRegistration)
                ->delete();
            
            // Also clear from cache
            cache()->forget('verified_email_' . $emailForRegistration);

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Registration successful!',
                'data' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
            ], 201);

        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Agent registration database error: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'Database error occurred.';
            if (config('app.debug')) {
                $errorMessage = $e->getMessage();
                if (str_contains($e->getMessage(), "Base table or view not found")) {
                    $errorMessage = 'Database table not found. Please run: php artisan migrate';
                } elseif (str_contains($e->getMessage(), "Unknown column")) {
                    $errorMessage = 'Database column mismatch. Please check your migration.';
                } elseif (str_contains($e->getMessage(), "Connection refused") || str_contains($e->getMessage(), "Access denied")) {
                    $errorMessage = 'Database connection failed. Please check your database credentials in .env';
                }
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => $errorMessage,
            ], 500);
            
        } catch (\Exception $e) {
            \Log::error('Agent registration error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            $errorMessage = 'An internal server error occurred.';
            if (config('app.debug')) {
                $errorMessage = $e->getMessage();
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => $errorMessage,
            ], 500);
        }
    }

    /**
     * Login user (agent or admin) and return access token.
     */
    #[OA\Post(
        path: "/login",
        summary: "Login user (agent or admin)",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["email", "password"],
                    properties: [
                        new OA\Property(property: "email", type: "string", format: "email", description: "User's email address"),
                        new OA\Property(property: "password", type: "string", description: "User's password"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Login successful",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "success", type: "boolean", example: true),
                        new OA\Property(property: "message", type: "string", example: "Login successful"),
                        new OA\Property(
                            property: "data",
                            type: "object",
                            properties: [
                                new OA\Property(property: "token", type: "string", example: "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"),
                                new OA\Property(property: "token_type", type: "string", example: "Bearer"),
                                new OA\Property(property: "user", type: "object"),
                                new OA\Property(property: "role", type: "string", example: "agent"),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 401,
                description: "Invalid credentials or inactive account",
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
            ),
        ]
    )]
    public function login(Request $request): JsonResponse
    {
        try {
            // Validate the request data
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Find the user by email (can be agent or admin)
            $user = User::where('email', $request->email)->first();

            // Check if user exists
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password',
                ], 401);
            }

            // Check if password is correct
            // Get raw password from database to avoid cast interference
            $storedPassword = $user->getRawOriginal('password');
            
            // Handle both hashed and plain text passwords (for migration purposes)
            $passwordValid = false;
            if (Hash::check($request->password, $storedPassword)) {
                $passwordValid = true;
            } elseif ($storedPassword === $request->password) {
                // If password is stored as plain text, hash it now
                $user->password = $request->password; // Will be auto-hashed by model cast
                $user->save();
                $passwordValid = true;
            }

            if (!$passwordValid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password',
                ], 401);
            }

            // Check if account is active
            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account is inactive. Please contact the administrator.',
                ], 401);
            }

            // Create a new token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Prepare response data based on user role
            $responseData = [
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'role' => $user->role,
            ];

            // Add role-specific data
            if ($user->isAgent()) {
                $responseData['agent'] = [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'agency_name' => $user->agency_name,
                    'prc_license_number' => $user->prc_license_number,
                    'license_type' => $user->license_type,
                    'status' => $user->status ?? 'pending',
                    'verified' => $user->verified ?? false,
                ];
            } elseif ($user->isAdmin()) {
                $responseData['admin'] = [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role,
                ];
            }

            // Return success response
            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => $responseData,
            ], 200);

        } catch (\Exception $e) {
            // Log the error
            \Log::error('Login error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $errorMessage = 'An internal server error occurred.';
            if (config('app.debug')) {
                $errorMessage = $e->getMessage();
            }

            return response()->json([
                'success' => false,
                'message' => 'Login failed. Please try again.',
                'error' => $errorMessage,
            ], 500);
        }
    }

    /**
     * Send email verification
     */
    public function sendVerificationEmail(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $email = trim($request->email);
            // Normalize email (lowercase) for consistent storage and lookup
            $normalizedEmail = strtolower($email);

            // Check if email is already registered (case-insensitive)
            $existingUser = User::whereRaw('LOWER(email) = ?', [$normalizedEmail])->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'This email is already registered',
                ], 422);
            }

            // Rate limiting: Check if email was sent recently (prevent spam)
            // Check both original and normalized email
            $recentToken = DB::table('email_verification_tokens')
                ->where(function($query) use ($email, $normalizedEmail) {
                    $query->where('email', $email)
                          ->orWhere('email', $normalizedEmail);
                })
                ->where('created_at', '>', now()->subMinutes(2))
                ->first();

            if ($recentToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please wait a few minutes before requesting another verification email.',
                ], 429);
            }

            // Generate verification token
            $token = Str::random(64);

            // Delete any existing tokens for this email (check both original and normalized)
            DB::table('email_verification_tokens')
                ->where(function($query) use ($email, $normalizedEmail) {
                    $query->where('email', $email)
                          ->orWhere('email', $normalizedEmail);
                })
                ->delete();

            // Store verification token with normalized email for consistency
            DB::table('email_verification_tokens')->insert([
                'email' => $normalizedEmail,
                'token' => $token,
                'created_at' => now(),
                'expires_at' => now()->addHours(24),
            ]);

            // Send verification email with a small delay to avoid spam detection
            try {
                // Queue the email instead of sending immediately (better for deliverability)
                // If queue is not configured, it will send immediately
                Mail::to($email)->send(new EmailVerificationMail($normalizedEmail, $token));
                
                // Log successful email send for monitoring
                \Log::info('Verification email sent', [
                    'email' => $email,
                    'timestamp' => now()->toDateTimeString(),
                ]);
            } catch (\Exception $mailException) {
                \Log::error('Mail sending error: ' . $mailException->getMessage(), [
                    'email' => $email,
                    'trace' => $mailException->getTraceAsString(),
                    'file' => $mailException->getFile(),
                    'line' => $mailException->getLine(),
                ]);

                // In development, provide more detailed error
                $errorMessage = 'Failed to send verification email.';
                if (config('app.debug')) {
                    $errorMessage .= ' Error: ' . $mailException->getMessage();
                } else {
                    $errorMessage .= ' Please check your mail configuration.';
                }

                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Verification email sent successfully',
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Send verification email error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $errorMessage = 'Failed to send verification email. Please try again.';
            if (config('app.debug')) {
                $errorMessage .= ' Error: ' . $e->getMessage();
            }

            return response()->json([
                'success' => false,
                'message' => $errorMessage,
            ], 500);
        }
    }

    /**
     * Verify email with token
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email|max:255',
                'token' => 'required|string',
            ]);

            if ($validator->fails()) {
                $errors = $validator->errors();
                $errorMessages = $errors->all();
                
                \Log::warning('Email verification validation failed', [
                    'email' => $request->email,
                    'token_length' => strlen($request->token ?? ''),
                    'errors' => $errorMessages,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed: ' . implode(', ', $errorMessages),
                    'errors' => $errors,
                ], 422);
            }

            $email = trim($request->email);
            $token = trim($request->token);

            // Decode email if URL encoded
            $email = urldecode($email);
            
            // Normalize email (lowercase for consistent cache keys)
            $normalizedEmail = strtolower(trim($email));

            \Log::info('Email verification attempt', [
                'email' => $email,
                'normalized_email' => $normalizedEmail,
                'token_length' => strlen($token),
                'token_preview' => substr($token, 0, 10) . '...',
            ]);

            // Find verification token (check both original and normalized email)
            $verification = DB::table('email_verification_tokens')
                ->where(function($query) use ($email, $normalizedEmail) {
                    $query->where('email', $email)
                          ->orWhere('email', $normalizedEmail);
                })
                ->where('token', $token)
                ->first();

            if (!$verification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification token',
                ], 422);
            }

            // Check if token is expired
            if (now()->greaterThan($verification->expires_at)) {
                DB::table('email_verification_tokens')
                    ->where('email', $email)
                    ->where('token', $token)
                    ->delete();

                return response()->json([
                    'success' => false,
                    'message' => 'Verification token has expired. Please request a new one.',
                ], 422);
            }

            // Mark email as verified (store in database for reliability)
            $normalizedEmail = strtolower(trim($email));
            
            // Store verified email in database (more reliable than cache)
            // Check if record exists first
            $existing = DB::table('verified_emails')
                ->where('email', $normalizedEmail)
                ->first();
            
            if ($existing) {
                // Update existing record
                DB::table('verified_emails')
                    ->where('email', $normalizedEmail)
                    ->update([
                        'verified_at' => now(),
                        'expires_at' => now()->addHours(24),
                        'updated_at' => now(),
                    ]);
            } else {
                // Insert new record
                DB::table('verified_emails')->insert([
                    'email' => $normalizedEmail,
                    'verified_at' => now(),
                    'expires_at' => now()->addHours(24),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            // Also store in cache for faster lookup
            cache()->put('verified_email_' . $normalizedEmail, true, now()->addHours(24));
            
            \Log::info('Email verified and stored', [
                'email' => $email,
                'normalized_email' => $normalizedEmail,
            ]);

            // Delete the used token
            DB::table('email_verification_tokens')
                ->where('email', $email)
                ->where('token', $token)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully',
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Verify email error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to verify email. Please try again.',
            ], 500);
        }
    }

    /**
     * Check email verification status
     */
    public function checkVerificationStatus(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $email = trim($request->email);
            
            // Normalize email for consistent lookup
            $normalizedEmail = strtolower($email);
            
            // Check if email is verified (check database first, then cache)
            $verifiedEmail = DB::table('verified_emails')
                ->where('email', $normalizedEmail)
                ->where(function($query) {
                    $query->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                })
                ->first();
            
            $isVerified = $verifiedEmail !== null;
            
            // Also check cache as fallback
            if (!$isVerified) {
                $isVerified = cache()->has('verified_email_' . $normalizedEmail);
            }

            return response()->json([
                'success' => true,
                'verified' => $isVerified,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Check verification status error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check verification status. Please try again.',
            ], 500);
        }
    }
}
