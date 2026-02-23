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
        // Add fields to properties table
        Schema::table('properties', function (Blueprint $table) {
            $table->string('draft_status', 20)->default('published')->after('published_at'); // draft, published
            $table->string('description_template', 50)->nullable()->after('description'); // narrative, bulleted, short, luxury, storytelling
            $table->text('ai_generated_description')->nullable()->after('description_template'); // AI-generated description stored separately
        });

        // Add fields to listing_assistant_conversations table
        Schema::table('listing_assistant_conversations', function (Blueprint $table) {
            $table->string('current_step', 50)->nullable()->after('status'); // property_name, property_type, location, price, bedrooms, bathrooms, optional_fields, images, map_location, description, review
            $table->index('current_step');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['draft_status', 'description_template', 'ai_generated_description']);
        });

        Schema::table('listing_assistant_conversations', function (Blueprint $table) {
            $table->dropIndex(['current_step']);
            $table->dropColumn('current_step');
        });
    }
};
