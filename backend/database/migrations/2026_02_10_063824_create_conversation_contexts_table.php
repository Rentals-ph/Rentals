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
        Schema::create('conversation_contexts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->string('context_type'); // 'preference', 'fact', 'search_criteria', 'property_interest', etc.
            $table->string('key'); // e.g., 'budget', 'location', 'property_type', 'user_name'
            $table->json('value'); // Flexible JSON storage for any value
            $table->integer('importance')->default(5); // 1-10 scale, higher = more important
            $table->text('description')->nullable(); // Human-readable description
            $table->timestamps();
            
            $table->index(['conversation_id', 'context_type']);
            $table->index(['conversation_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_contexts');
    }
};
