<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove owner-related columns and rent_manager_id.
     * Make agent_id required since properties must belong to an agent.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            // Collect columns to drop
            $columnsToDrop = [];
            
            // Owner-related columns
            $ownerColumns = [
                'owner_firstname',
                'owner_lastname',
                'owner_phone',
                'owner_email',
                'owner_country',
                'owner_state',
                'owner_city',
                'owner_street_address',
                'rapa_document_path',
            ];
            
            foreach ($ownerColumns as $column) {
                if (Schema::hasColumn('properties', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            
            // Drop owner columns if any exist
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
            
            // Drop rent_manager_id if it exists
            if (Schema::hasColumn('properties', 'rent_manager_id')) {
                $table->dropForeign(['rent_manager_id']);
                $table->dropColumn('rent_manager_id');
            }
        });
        
        // Make agent_id required (not nullable)
        // First, ensure all properties have an agent_id
        // If there are properties without agent_id, we need to handle them
        if (Schema::hasColumn('properties', 'agent_id')) {
            // Check if there are properties with NULL agent_id
            $nullAgentCount = DB::table('properties')->whereNull('agent_id')->count();
            
            if ($nullAgentCount > 0) {
                // Option 1: Delete properties without agent_id (recommended for clean data)
                // Option 2: Assign them to a default agent (if you have one)
                // For now, we'll delete them as properties should always have an agent
                DB::table('properties')->whereNull('agent_id')->delete();
            }
            
            // Drop the existing foreign key constraint (it uses nullOnDelete which requires nullable)
            Schema::table('properties', function (Blueprint $table) {
                $table->dropForeign(['agent_id']);
            });
            
            // Now make agent_id required
            Schema::table('properties', function (Blueprint $table) {
                $table->foreignId('agent_id')->nullable(false)->change();
            });
            
            // Re-add the foreign key constraint with CASCADE (since properties must have an agent)
            Schema::table('properties', function (Blueprint $table) {
                $table->foreign('agent_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            // Re-add owner columns
            $table->string('owner_firstname', 100)->nullable()->after('street_address');
            $table->string('owner_lastname', 100)->nullable()->after('owner_firstname');
            $table->string('owner_phone', 50)->nullable()->after('owner_lastname');
            $table->string('owner_email', 255)->nullable()->after('owner_phone');
            $table->string('owner_country', 100)->nullable()->after('owner_email');
            $table->string('owner_state', 100)->nullable()->after('owner_country');
            $table->string('owner_city', 100)->nullable()->after('owner_state');
            $table->text('owner_street_address')->nullable()->after('owner_city');
            $table->string('rapa_document_path')->nullable()->after('owner_street_address');
            
            // Re-add rent_manager_id
            $table->foreignId('rent_manager_id')->nullable()->constrained()->nullOnDelete();
        });
        
        // Make agent_id nullable again
        Schema::table('properties', function (Blueprint $table) {
            if (Schema::hasColumn('properties', 'agent_id')) {
                // Drop the foreign key constraint first
                $table->dropForeign(['agent_id']);
                
                // Make it nullable
                $table->foreignId('agent_id')->nullable()->change();
                
                // Re-add the foreign key with nullOnDelete
                $table->foreign('agent_id')->references('id')->on('users')->nullOnDelete();
            }
        });
    }
};
