<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove the location column as it's redundant with more specific location fields
     * (country, state_province, city, street_address).
     */
    public function up(): void
    {
        $connection = DB::getDriverName();
        
        // Drop location column if it exists
        if (Schema::hasColumn('properties', 'location')) {
            if ($connection === 'pgsql') {
                // PostgreSQL: First drop indexes, then make column nullable, then drop it
                // Drop indexes
                $indexes = DB::select("
                    SELECT indexname 
                    FROM pg_indexes 
                    WHERE tablename = 'properties' 
                    AND indexname IN ('idx_properties_location', 'idx_properties_type_location')
                ");
                foreach ($indexes as $index) {
                    DB::statement("DROP INDEX IF EXISTS " . $index->indexname);
                }
                
                // Make column nullable first (in case it has NOT NULL constraint)
                DB::statement("ALTER TABLE properties ALTER COLUMN location DROP NOT NULL");
                
                // Drop the column
                DB::statement("ALTER TABLE properties DROP COLUMN IF EXISTS location");
            } else {
                // MySQL: Use Schema builder
                Schema::table('properties', function (Blueprint $table) {
                    // Drop indexes
                    try {
                        $table->dropIndex('idx_properties_location');
                    } catch (\Exception $e) {
                        // Index doesn't exist, continue
                    }
                    
                    try {
                        $table->dropIndex('idx_properties_type_location');
                    } catch (\Exception $e) {
                        // Index doesn't exist, continue
                    }
                    
                    // Drop the location column
                    $table->dropColumn('location');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            // Re-add location column
            if (!Schema::hasColumn('properties', 'location')) {
                $table->string('location')->after('type');
                
                // Re-add indexes
                $table->index('location', 'idx_properties_location');
                $table->index(['type', 'location'], 'idx_properties_type_location');
            }
        });
    }
};
