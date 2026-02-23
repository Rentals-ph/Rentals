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
        Schema::create('listing_assistant_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('conversation_id')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->json('extracted_data')->nullable(); // All extracted property fields
            $table->json('skipped_fields')->nullable(); // Fields explicitly skipped by agent
            $table->json('messages')->nullable(); // Conversation history
            $table->string('status')->default('in_progress'); // in_progress, completed, submitted
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listing_assistant_conversations');
    }
};
