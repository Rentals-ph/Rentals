<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add 'broker' role to the users table role enum.
     */
    public function up(): void
    {
        $connection = DB::getDriverName();
        
        if ($connection === 'pgsql') {
            // PostgreSQL: Laravel uses varchar with CHECK constraint for ENUMs
            // We need to drop the old constraint and create a new one with 'broker' included
            
            // First, find and drop the existing CHECK constraint
            $constraintName = DB::selectOne("
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = 'users'
                AND constraint_type = 'CHECK'
                AND constraint_name LIKE '%role%'
            ");
            
            if ($constraintName) {
                DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS {$constraintName->constraint_name}");
            }
            
            // Also try the common Laravel naming convention
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            
            // Create new CHECK constraint with 'broker' included
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('agent', 'admin', 'super_admin', 'moderator', 'broker'))");
        } else {
            // MySQL: Alter the enum column
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'role')) {
                    $table->enum('role', ['agent', 'admin', 'super_admin', 'moderator', 'broker'])
                        ->default('agent')
                        ->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $connection = DB::getDriverName();
        
        if ($connection === 'pgsql') {
            // PostgreSQL: Drop the constraint and recreate without 'broker'
            // First, update any broker users to agent
            DB::table('users')->where('role', 'broker')->update(['role' => 'agent']);
            
            // Drop the constraint
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            
            // Recreate without 'broker'
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('agent', 'admin', 'super_admin', 'moderator'))");
        } else {
            // MySQL: Change the enum back
            Schema::table('users', function (Blueprint $table) {
                // First, update any broker users to agent
                DB::table('users')->where('role', 'broker')->update(['role' => 'agent']);
                
                // Then change the enum back
                $table->enum('role', ['agent', 'admin', 'super_admin', 'moderator'])
                    ->default('agent')
                    ->change();
            });
        }
    }
};
