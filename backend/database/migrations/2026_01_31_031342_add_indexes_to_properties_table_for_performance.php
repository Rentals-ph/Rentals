<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            // Indexes for commonly queried fields
            $table->index('agent_id', 'idx_properties_agent_id');
            $table->index('type', 'idx_properties_type');
            $table->index('location', 'idx_properties_location');
            $table->index('is_featured', 'idx_properties_is_featured');
            $table->index('published_at', 'idx_properties_published_at');
            $table->index(['type', 'location'], 'idx_properties_type_location');
            $table->index(['agent_id', 'published_at'], 'idx_properties_agent_published');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex('idx_properties_agent_id');
            $table->dropIndex('idx_properties_type');
            $table->dropIndex('idx_properties_location');
            $table->dropIndex('idx_properties_is_featured');
            $table->dropIndex('idx_properties_published_at');
            $table->dropIndex('idx_properties_type_location');
            $table->dropIndex('idx_properties_agent_published');
        });
    }
};
