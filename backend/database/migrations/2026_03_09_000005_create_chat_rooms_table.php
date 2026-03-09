<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Chat rooms scoped to (property × agent × tenant/guest).
     *
     * Each room has exactly two parties:
     *   1. The agent who owns the listing  (agent_id → users)
     *   2. The other party — either a registered tenant (user_id → users)
     *      or a guest (guest_session_id → guest_sessions)
     *
     * Exactly one of user_id / guest_session_id must be non-null.
     */
    public function up(): void
    {
        Schema::create('chat_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();

            // Tenant party (only one of these is set per room)
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('guest_session_id')->nullable()->constrained('guest_sessions')->cascadeOnDelete();

            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            // Prevent duplicate rooms for the same property + agent + tenant
            $table->unique(['property_id', 'agent_id', 'user_id'], 'uq_room_user');
            $table->unique(['property_id', 'agent_id', 'guest_session_id'], 'uq_room_guest');

            $table->index('agent_id');
            $table->index('user_id');
            $table->index('guest_session_id');
            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_rooms');
    }
};

