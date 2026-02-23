<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, if users table exists and has a 'name' column, make it nullable
        // This must be done before any inserts to avoid "Field 'name' doesn't have a default value" errors
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'name')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('name')->nullable()->change();
                });
            } catch (\Exception $e) {
                // If the column is already nullable or doesn't exist, continue
            }
        }
        
        // Check if users table already exists (from Laravel default)
        // If it exists, we'll modify it; if not, create it
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                // Personal Information (common to both)
                $table->string('first_name');
                $table->string('last_name');
                $table->string('email')->unique();
                $table->string('password');
                $table->string('phone')->nullable();
                $table->date('date_of_birth')->nullable();
                
                // Role column
                $table->enum('role', ['agent', 'admin', 'super_admin', 'moderator'])->default('agent');
                
                // Agent-specific fields (nullable for admins)
                $table->string('agency_name')->nullable();
                $table->text('office_address')->nullable();
                $table->string('city')->nullable();
                $table->string('state')->nullable();
                $table->string('zip_code')->nullable();
                $table->string('prc_license_number')->nullable();
                $table->enum('license_type', ['broker', 'salesperson'])->nullable();
                $table->date('expiration_date')->nullable();
                $table->string('years_of_experience')->nullable();
                $table->string('license_document_path')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected'])->nullable();
                $table->boolean('verified')->default(false);
                
                // Admin-specific fields (nullable for agents)
                $table->boolean('is_active')->default(true);
                
                $table->timestamp('email_verified_at')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        } else {
            // If users table exists, modify it to add missing columns
            // First, make name column nullable if it exists
            if (Schema::hasColumn('users', 'name')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('name')->nullable()->change();
                });
            }
            
            Schema::table('users', function (Blueprint $table) {
                // Handle name column - if it exists, we might need to split it
                // For now, add first_name and last_name, and we'll handle name separately
                if (!Schema::hasColumn('users', 'first_name')) {
                    if (Schema::hasColumn('users', 'name')) {
                        // Add first_name and last_name after name, we'll migrate name data later
                        $table->string('first_name')->nullable()->after('id');
                        $table->string('last_name')->nullable()->after('first_name');
                    } else {
                        $table->string('first_name')->after('id');
                        $table->string('last_name')->after('first_name');
                    }
                }
                if (!Schema::hasColumn('users', 'phone')) {
                    $table->string('phone')->nullable()->after('password');
                }
                if (!Schema::hasColumn('users', 'date_of_birth')) {
                    $table->date('date_of_birth')->nullable()->after('phone');
                }
                if (!Schema::hasColumn('users', 'role')) {
                    $table->enum('role', ['agent', 'admin', 'super_admin', 'moderator'])->default('agent')->after('date_of_birth');
                }
                if (!Schema::hasColumn('users', 'agency_name')) {
                    $table->string('agency_name')->nullable()->after('role');
                }
                if (!Schema::hasColumn('users', 'office_address')) {
                    $table->text('office_address')->nullable()->after('agency_name');
                }
                if (!Schema::hasColumn('users', 'city')) {
                    $table->string('city')->nullable()->after('office_address');
                }
                if (!Schema::hasColumn('users', 'state')) {
                    $table->string('state')->nullable()->after('city');
                }
                if (!Schema::hasColumn('users', 'zip_code')) {
                    $table->string('zip_code')->nullable()->after('state');
                }
                if (!Schema::hasColumn('users', 'prc_license_number')) {
                    $table->string('prc_license_number')->nullable()->after('zip_code');
                }
                if (!Schema::hasColumn('users', 'license_type')) {
                    $table->enum('license_type', ['broker', 'salesperson'])->nullable()->after('prc_license_number');
                }
                if (!Schema::hasColumn('users', 'expiration_date')) {
                    $table->date('expiration_date')->nullable()->after('license_type');
                }
                if (!Schema::hasColumn('users', 'years_of_experience')) {
                    $table->string('years_of_experience')->nullable()->after('expiration_date');
                }
                if (!Schema::hasColumn('users', 'license_document_path')) {
                    $table->string('license_document_path')->nullable()->after('years_of_experience');
                }
                if (!Schema::hasColumn('users', 'status')) {
                    $table->enum('status', ['pending', 'approved', 'rejected'])->nullable()->after('license_document_path');
                }
                if (!Schema::hasColumn('users', 'verified')) {
                    $table->boolean('verified')->default(false)->after('status');
                }
                if (!Schema::hasColumn('users', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('verified');
                }
            });
            
            // Migrate existing users' name to first_name/last_name if needed
            if (Schema::hasColumn('users', 'name')) {
                $existingUsers = DB::table('users')->whereNull('first_name')->get();
                foreach ($existingUsers as $user) {
                    $nameParts = explode(' ', $user->name ?? '', 2);
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'first_name' => $nameParts[0] ?? 'User',
                            'last_name' => $nameParts[1] ?? '',
                            'role' => 'agent', // Default existing users to agent role
                        ]);
                }
            }
        }

        // Migrate data from agents table
        if (Schema::hasTable('agents')) {
            $agents = DB::table('agents')->get();
            foreach ($agents as $agent) {
                // Check if user with this email already exists
                $existingUser = DB::table('users')->where('email', $agent->email)->first();
                if ($existingUser) {
                    // Update existing user instead of inserting
                    $updateData = [
                        'first_name' => $agent->first_name,
                        'last_name' => $agent->last_name,
                        'password' => $agent->password,
                            'phone' => $agent->phone,
                            'date_of_birth' => $agent->date_of_birth,
                            'role' => 'agent',
                            'agency_name' => $agent->agency_name,
                            'office_address' => $agent->office_address,
                            'city' => $agent->city,
                            'state' => $agent->state,
                            'zip_code' => $agent->zip_code,
                            'prc_license_number' => $agent->prc_license_number,
                            'license_type' => $agent->license_type,
                            'expiration_date' => $agent->expiration_date,
                            'years_of_experience' => $agent->years_of_experience,
                            'license_document_path' => $agent->license_document_path,
                            'status' => $agent->status,
                            'verified' => $agent->verified ?? false,
                            'is_active' => true,
                            'email_verified_at' => $agent->email_verified_at,
                            'remember_token' => $agent->remember_token,
                            'updated_at' => $agent->updated_at,
                        ];
                        
                        // Add name column if it exists
                        if (Schema::hasColumn('users', 'name')) {
                            $updateData['name'] = $agent->first_name . ' ' . $agent->last_name;
                        }
                        
                        DB::table('users')
                            ->where('id', $existingUser->id)
                            ->update($updateData);
                    continue;
                }
                
                // Build insert array
                $insertData = [
                    'first_name' => $agent->first_name,
                    'last_name' => $agent->last_name,
                    'email' => $agent->email,
                    'password' => $agent->password,
                    'phone' => $agent->phone,
                    'date_of_birth' => $agent->date_of_birth,
                    'role' => 'agent',
                    'agency_name' => $agent->agency_name,
                    'office_address' => $agent->office_address,
                    'city' => $agent->city,
                    'state' => $agent->state,
                    'zip_code' => $agent->zip_code,
                    'prc_license_number' => $agent->prc_license_number,
                    'license_type' => $agent->license_type,
                    'expiration_date' => $agent->expiration_date,
                    'years_of_experience' => $agent->years_of_experience,
                    'license_document_path' => $agent->license_document_path,
                    'status' => $agent->status,
                    'verified' => $agent->verified ?? false,
                    'is_active' => true,
                    'email_verified_at' => $agent->email_verified_at,
                    'remember_token' => $agent->remember_token,
                    'created_at' => $agent->created_at,
                    'updated_at' => $agent->updated_at,
                ];
                
                // Add name column if it exists (for backward compatibility)
                if (Schema::hasColumn('users', 'name')) {
                    $insertData['name'] = $agent->first_name . ' ' . $agent->last_name;
                }
                
                DB::table('users')->insert($insertData);
            }
        }

        // Migrate data from admins table
        if (Schema::hasTable('admins')) {
            $admins = DB::table('admins')->get();
            foreach ($admins as $admin) {
                // Check if user with this email already exists
                $existingUser = DB::table('users')->where('email', $admin->email)->first();
                if ($existingUser) {
                    // Update existing user instead of inserting
                    $updateData = [
                        'first_name' => $admin->first_name,
                        'last_name' => $admin->last_name,
                        'password' => $admin->password,
                            'phone' => $admin->phone,
                            'role' => $admin->role ?? 'admin',
                            'is_active' => $admin->is_active ?? true,
                            'verified' => true,
                            'email_verified_at' => $admin->email_verified_at,
                            'remember_token' => $admin->remember_token,
                            'updated_at' => $admin->updated_at,
                        ];
                        
                        // Add name column if it exists
                        if (Schema::hasColumn('users', 'name')) {
                            $updateData['name'] = $admin->first_name . ' ' . $admin->last_name;
                        }
                        
                        DB::table('users')
                            ->where('id', $existingUser->id)
                            ->update($updateData);
                    continue;
                }
                
                // Build insert array
                $insertData = [
                    'first_name' => $admin->first_name,
                    'last_name' => $admin->last_name,
                    'email' => $admin->email,
                    'password' => $admin->password,
                    'phone' => $admin->phone,
                    'date_of_birth' => null,
                    'role' => $admin->role ?? 'admin',
                    'agency_name' => null,
                    'office_address' => null,
                    'city' => null,
                    'state' => null,
                    'zip_code' => null,
                    'prc_license_number' => null,
                    'license_type' => null,
                    'expiration_date' => null,
                    'years_of_experience' => null,
                    'license_document_path' => null,
                    'status' => null,
                    'verified' => true,
                    'is_active' => $admin->is_active ?? true,
                    'email_verified_at' => $admin->email_verified_at,
                    'remember_token' => $admin->remember_token,
                    'created_at' => $admin->created_at,
                    'updated_at' => $admin->updated_at,
                ];
                
                // Add name column if it exists (for backward compatibility)
                if (Schema::hasColumn('users', 'name')) {
                    $insertData['name'] = $admin->first_name . ' ' . $admin->last_name;
                }
                
                DB::table('users')->insert($insertData);
            }
        }

        // Update agent_approvals table to use user_id
        if (Schema::hasTable('agent_approvals')) {
            // First, create a mapping of old IDs to new user IDs
            $agentIdMap = [];
            if (Schema::hasTable('agents')) {
                $agents = DB::table('agents')->get();
                foreach ($agents as $agent) {
                    $user = DB::table('users')
                        ->where('email', $agent->email)
                        ->where('role', 'agent')
                        ->first();
                    if ($user) {
                        $agentIdMap[$agent->id] = $user->id;
                    }
                }
            }
            
            $adminIdMap = [];
            if (Schema::hasTable('admins')) {
                $admins = DB::table('admins')->get();
                foreach ($admins as $admin) {
                    $user = DB::table('users')
                        ->where('email', $admin->email)
                        ->whereIn('role', ['admin', 'super_admin', 'moderator'])
                        ->first();
                    if ($user) {
                        $adminIdMap[$admin->id] = $user->id;
                    }
                }
            }
            
            Schema::table('agent_approvals', function (Blueprint $table) {
                // Drop foreign keys first
                $table->dropForeign(['agent_id']);
                $table->dropForeign(['admin_id']);
            });
            
            // Add new columns
            Schema::table('agent_approvals', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
                $table->unsignedBigInteger('approved_by_user_id')->nullable()->after('user_id');
            });
            
            // Migrate data
            $approvals = DB::table('agent_approvals')->get();
            foreach ($approvals as $approval) {
                $userId = $agentIdMap[$approval->agent_id] ?? null;
                $approvedByUserId = $adminIdMap[$approval->admin_id] ?? null;
                
                if ($userId && $approvedByUserId) {
                    DB::table('agent_approvals')
                        ->where('id', $approval->id)
                        ->update([
                            'user_id' => $userId,
                            'approved_by_user_id' => $approvedByUserId,
                        ]);
                }
            }
            
            // Make columns required and add foreign keys
            Schema::table('agent_approvals', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable(false)->change();
                $table->unsignedBigInteger('approved_by_user_id')->nullable(false)->change();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('approved_by_user_id')->references('id')->on('users')->onDelete('cascade');
                
                // Drop old columns
                $table->dropColumn(['agent_id', 'admin_id']);
            });
        }

        // Drop old tables
        Schema::dropIfExists('agents');
        Schema::dropIfExists('admins');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate agents and admins tables
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('agency_name')->nullable();
            $table->text('office_address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('zip_code')->nullable();
            $table->string('prc_license_number');
            $table->enum('license_type', ['broker', 'salesperson']);
            $table->date('expiration_date');
            $table->string('years_of_experience')->nullable();
            $table->string('license_document_path')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->boolean('verified')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->enum('role', ['super_admin', 'admin', 'moderator'])->default('admin');
            $table->boolean('is_active')->default(true);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Migrate data back from users table
        $agentUsers = DB::table('users')->where('role', 'agent')->get();
        foreach ($agentUsers as $user) {
            DB::table('agents')->insert([
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'password' => $user->password,
                'phone' => $user->phone,
                'date_of_birth' => $user->date_of_birth,
                'agency_name' => $user->agency_name,
                'office_address' => $user->office_address,
                'city' => $user->city,
                'state' => $user->state,
                'zip_code' => $user->zip_code,
                'prc_license_number' => $user->prc_license_number,
                'license_type' => $user->license_type,
                'expiration_date' => $user->expiration_date,
                'years_of_experience' => $user->years_of_experience,
                'license_document_path' => $user->license_document_path,
                'status' => $user->status,
                'verified' => $user->verified,
                'email_verified_at' => $user->email_verified_at,
                'remember_token' => $user->remember_token,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);
        }

        $adminUsers = DB::table('users')->whereIn('role', ['admin', 'super_admin', 'moderator'])->get();
        foreach ($adminUsers as $user) {
            DB::table('admins')->insert([
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'password' => $user->password,
                'phone' => $user->phone,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'email_verified_at' => $user->email_verified_at,
                'remember_token' => $user->remember_token,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]);
        }

        // Revert agent_approvals table
        if (Schema::hasTable('agent_approvals')) {
            Schema::table('agent_approvals', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropForeign(['approved_by_user_id']);
                $table->unsignedBigInteger('agent_id')->after('id');
                $table->unsignedBigInteger('admin_id')->after('agent_id');
                $table->foreign('agent_id')->references('id')->on('agents')->onDelete('cascade');
                $table->foreign('admin_id')->references('id')->on('admins')->onDelete('cascade');
                $table->dropColumn(['user_id', 'approved_by_user_id']);
            });
        }
    }
};
