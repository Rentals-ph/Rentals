<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a 'status' column to properties.
     * Statuses: available, rented, under_negotiation, unlisted
     */
    public function up(): void
    {
        $connection = DB::getDriverName();

        if ($connection === 'pgsql') {
            // PostgreSQL: add as varchar with check constraint
            Schema::table('properties', function (Blueprint $table) {
                if (!Schema::hasColumn('properties', 'status')) {
                    $table->string('status', 30)->default('available')->after('draft_status');
                }
            });

            DB::statement("ALTER TABLE properties ADD CONSTRAINT properties_status_check CHECK (status IN ('available', 'rented', 'under_negotiation', 'unlisted'))");
        } else {
            Schema::table('properties', function (Blueprint $table) {
                if (!Schema::hasColumn('properties', 'status')) {
                    $table->enum('status', ['available', 'rented', 'under_negotiation', 'unlisted'])
                        ->default('available')
                        ->after('draft_status');
                }
            });
        }

        // Index for filtering by status
        Schema::table('properties', function (Blueprint $table) {
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            if (Schema::hasColumn('properties', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};

