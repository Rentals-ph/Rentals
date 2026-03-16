<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Domain\Users\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only proceed if rent_managers table exists
        if (!Schema::hasTable('rent_managers')) {
            return;
        }

        // Get all rent managers
        $rentManagers = DB::table('rent_managers')->get();
        
        // Map to store old rent_manager_id to new user_id
        $rentManagerToUserMap = [];

        // Migrate each rent manager to users table
        foreach ($rentManagers as $rentManager) {
            // Split name into first_name and last_name
            $nameParts = explode(' ', $rentManager->name, 2);
            $firstName = $nameParts[0] ?? 'Rent';
            $lastName = $nameParts[1] ?? 'Manager';

            // Check if user with this email already exists
            $existingUser = User::where('email', $rentManager->email)->first();
            
            if ($existingUser) {
                // Use existing user, just update role if needed
                if (!$existingUser->isAgent()) {
                    $existingUser->role = 'agent';
                    $existingUser->verified = true;
                    $existingUser->is_active = true;
                    $existingUser->status = 'approved';
                    $existingUser->save();
                }
                $rentManagerToUserMap[$rentManager->id] = $existingUser->id;
            } else {
                // Create new user
                $user = User::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $rentManager->email,
                    'password' => Hash::make('password'), // Default password, should be changed
                    'role' => 'agent',
                    'verified' => true,
                    'is_active' => true,
                    'status' => 'approved',
                    'email_verified_at' => now(),
                ]);
                
                $rentManagerToUserMap[$rentManager->id] = $user->id;
            }
        }

        // Update properties to use agent_id instead of rent_manager_id
        foreach ($rentManagerToUserMap as $oldRentManagerId => $newUserId) {
            DB::table('properties')
                ->where('rent_manager_id', $oldRentManagerId)
                ->update([
                    'agent_id' => $newUserId,
                    'rent_manager_id' => null,
                ]);
        }

        // Drop foreign key constraint and column if they exist
        if (Schema::hasTable('properties') && Schema::hasColumn('properties', 'rent_manager_id')) {
            Schema::table('properties', function (Blueprint $table) {
                // Try to drop foreign key - will fail silently if it doesn't exist
                try {
                    $table->dropForeign(['rent_manager_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist or have different name, continue
                }
                
                // Drop the column
                $table->dropColumn('rent_manager_id');
            });
        }

        // Drop the rent_managers table
        Schema::dropIfExists('rent_managers');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate rent_managers table
        Schema::create('rent_managers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->boolean('is_official')->default(false);
            $table->timestamps();
        });

        // Note: We cannot fully reverse the migration as we don't know which users
        // were originally rent managers. This is a one-way migration.
        // If you need to reverse, you would need to manually identify and migrate back.
    }
};
