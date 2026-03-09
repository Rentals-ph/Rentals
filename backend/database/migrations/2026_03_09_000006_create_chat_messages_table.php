<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Individual messages inside a chat room.
     *
     * sender_type distinguishes who sent the message:
     *   'user'          → registered user (agent or tenant), sender_id → users.id
     *   'guest_session' → guest, sender_id → guest_sessions.id
     */
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_room_id')->constrained('chat_rooms')->cascadeOnDelete();

            // Polymorphic-style sender (avoids full polymorphic overhead)
            $table->string('sender_type', 20)->comment('user or guest_session');
            $table->unsignedBigInteger('sender_id');

            $table->text('body');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['chat_room_id', 'created_at']);
            $table->index(['sender_type', 'sender_id']);
            $table->index('is_read');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};

