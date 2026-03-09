<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * In-app notifications for registered users (tenants, agents, brokers, admins).
     * Named user_notifications to avoid collision with Laravel's built-in notifications table.
     */
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Type slug: new_message, new_inquiry, new_review, new_chat_message, etc.
            $table->string('type', 60);

            $table->string('title');
            $table->text('body')->nullable();

            // JSON bag for any extra data (e.g. property_id, chat_room_id, review_id)
            $table->json('data')->nullable();

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};

