<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reviews for both properties and agents/brokers.
     *
     * reviewable_type / reviewable_id — the thing being reviewed:
     *   'App\Models\Property' or 'App\Models\User'
     *
     * reviewer_type — who wrote the review:
     *   'user'          → registered tenant, reviewer_id → users.id
     *   'guest_session' → guest, reviewer_id → guest_sessions.id
     *
     * Guests' reviews are held as 'pending' until their email is confirmed.
     * Moderation status mirrors the approval flow used elsewhere in the app.
     */
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            // What is being reviewed (Property or User/agent)
            $table->string('reviewable_type', 100);
            $table->unsignedBigInteger('reviewable_id');

            // Who wrote the review
            $table->string('reviewer_type', 20)->comment('user or guest_session');
            $table->unsignedBigInteger('reviewer_id');

            // Guest identity snapshot (populated when reviewer_type = guest_session)
            $table->string('reviewer_name')->nullable();
            $table->string('reviewer_email')->nullable()->index();

            $table->unsignedTinyInteger('rating')->comment('1–5 stars');
            $table->text('comment')->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();

            $table->index(['reviewable_type', 'reviewable_id', 'status'], 'idx_reviewable');
            $table->index(['reviewer_type', 'reviewer_id'], 'idx_reviewer');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};

