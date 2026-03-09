<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add 'tenant' to the users table role enum.
     * Updated enum: agent, admin, super_admin, moderator, broker, tenant
     */
    public function up(): void
    {
        $connection = DB::getDriverName();

        if ($connection === 'pgsql') {
            // Drop old CHECK constraint (both possible naming conventions)
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");

            // Recreate with 'tenant' added
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('agent', 'admin', 'super_admin', 'moderator', 'broker', 'tenant'))");
        } else {
            // MySQL
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'role')) {
                    $table->enum('role', ['agent', 'admin', 'super_admin', 'moderator', 'broker', 'tenant'])
                        ->default('agent')
                        ->change();
                }
            });
        }
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        $connection = DB::getDriverName();

        if ($connection === 'pgsql') {
            // Remove any tenant users before rolling back
            DB::table('users')->where('role', 'tenant')->update(['role' => 'agent']);

            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('agent', 'admin', 'super_admin', 'moderator', 'broker'))");
        } else {
            DB::table('users')->where('role', 'tenant')->update(['role' => 'agent']);

            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['agent', 'admin', 'super_admin', 'moderator', 'broker'])
                    ->default('agent')
                    ->change();
            });
        }
    }
};

