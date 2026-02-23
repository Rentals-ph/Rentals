<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Makes unnecessary columns nullable for simplified registration.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Make PRC-related fields nullable (not required for simplified registration)
            if (Schema::hasColumn('users', 'prc_license_number')) {
                $table->string('prc_license_number')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'license_type')) {
                // Handle ENUM column modification based on database driver
                $driver = DB::getDriverName();
                if ($driver === 'mysql' || $driver === 'mariadb') {
                    // MySQL/MariaDB syntax
                    DB::statement("ALTER TABLE users MODIFY COLUMN license_type ENUM('broker', 'salesperson') NULL");
                } elseif ($driver === 'pgsql') {
                    // PostgreSQL syntax - just drop NOT NULL constraint
                    DB::statement("ALTER TABLE users ALTER COLUMN license_type DROP NOT NULL");
                } else {
                    // For other databases, try using Laravel's change method
                    // Note: This may not work for all ENUM implementations
                    try {
                        $table->enum('license_type', ['broker', 'salesperson'])->nullable()->change();
                    } catch (\Exception $e) {
                        // Fallback: use raw SQL if change() doesn't work
                        DB::statement("ALTER TABLE users ALTER COLUMN license_type DROP NOT NULL");
                    }
                }
            }
            if (Schema::hasColumn('users', 'expiration_date')) {
                $table->date('expiration_date')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'license_document_path')) {
                $table->string('license_document_path')->nullable()->change();
            }
            
            // Make agency-related fields nullable
            if (Schema::hasColumn('users', 'agency_name')) {
                $table->string('agency_name')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'office_address')) {
                $table->text('office_address')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'city')) {
                $table->string('city')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'state')) {
                $table->string('state')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'zip_code')) {
                $table->string('zip_code')->nullable()->change();
            }
            
            // Make other optional fields nullable
            if (Schema::hasColumn('users', 'years_of_experience')) {
                $table->string('years_of_experience')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->change();
            }
            
            // Make first_name and last_name nullable (can be updated later)
            if (Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable()->change();
            }
            if (Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Revert PRC-related fields to required (if needed)
            if (Schema::hasColumn('users', 'prc_license_number')) {
                $table->string('prc_license_number')->nullable(false)->change();
            }
            if (Schema::hasColumn('users', 'license_type')) {
                // Handle ENUM column modification based on database driver
                $driver = DB::getDriverName();
                if ($driver === 'mysql' || $driver === 'mariadb') {
                    // MySQL/MariaDB syntax
                    DB::statement("ALTER TABLE users MODIFY COLUMN license_type ENUM('broker', 'salesperson') NOT NULL");
                } elseif ($driver === 'pgsql') {
                    // PostgreSQL syntax - add NOT NULL constraint
                    DB::statement("ALTER TABLE users ALTER COLUMN license_type SET NOT NULL");
                } else {
                    // For other databases, try using Laravel's change method
                    try {
                        $table->enum('license_type', ['broker', 'salesperson'])->nullable(false)->change();
                    } catch (\Exception $e) {
                        // Fallback: use raw SQL if change() doesn't work
                        DB::statement("ALTER TABLE users ALTER COLUMN license_type SET NOT NULL");
                    }
                }
            }
            if (Schema::hasColumn('users', 'expiration_date')) {
                $table->date('expiration_date')->nullable(false)->change();
            }
            
            // Revert first_name and last_name to required
            if (Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name')->nullable(false)->change();
            }
            if (Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name')->nullable(false)->change();
            }
        });
    }
};
