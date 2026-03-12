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
        Schema::create('inquiry_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('broker_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_email'); // Customer email (may not be registered)
            $table->string('customer_name'); // Customer name
            $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->enum('type', ['contact', 'property_inquiry', 'general'])->default('property_inquiry');
            $table->string('subject')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index('agent_id');
            $table->index('broker_id');
            $table->index('customer_email');
            $table->index('property_id');
            $table->index('last_message_at');
            
            // Note: Unique constraint handled in application logic due to NULL handling in MySQL
            // We'll use firstOrCreate with proper key matching in the controller
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inquiry_conversations');
    }
};

