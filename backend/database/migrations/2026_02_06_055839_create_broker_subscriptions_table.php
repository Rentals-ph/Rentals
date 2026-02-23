<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Create broker_subscriptions table to track broker plan usage.
     */
    public function up(): void
    {
        Schema::create('broker_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('broker_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('broker_plans')->onDelete('restrict');
            
            // Usage tracking
            $table->integer('listings_used')->default(0);
            $table->integer('teams_used')->default(0);
            $table->integer('agents_used')->default(0);
            
            // Subscription status
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamp('starts_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            
            $table->timestamps();
            
            $table->index('broker_id');
            $table->index('plan_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broker_subscriptions');
    }
};
