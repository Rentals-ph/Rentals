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
        Schema::create('broker_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('broker_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('report_date');
            $table->string('period_type')->default('monthly'); // daily, weekly, monthly, quarterly, yearly
            
            // Inquiry metrics
            $table->integer('total_inquiries')->default(0);
            $table->integer('inquiries_whatsapp')->default(0);
            $table->integer('inquiries_email')->default(0);
            $table->integer('inquiries_sms')->default(0);
            $table->integer('inquiries_phone')->default(0);
            
            // Conversion metrics
            $table->decimal('conversion_rate', 5, 2)->default(0); // percentage
            $table->integer('conversions')->default(0);
            
            // Response metrics
            $table->integer('average_response_time_minutes')->default(0);
            $table->integer('total_responses')->default(0);
            
            // Listing metrics
            $table->integer('total_listings')->default(0);
            $table->integer('active_listings')->default(0);
            $table->integer('rented_listings')->default(0);
            $table->integer('hidden_listings')->default(0);
            
            // Property type distribution
            $table->integer('listings_condos')->default(0);
            $table->integer('listings_houses')->default(0);
            $table->integer('listings_studios')->default(0);
            $table->integer('listings_apartments')->default(0);
            $table->integer('listings_commercial')->default(0);
            
            // Location performance
            $table->json('location_performance')->nullable(); // { "Cebu": 3200, "Makati": 2600, ... }
            
            // Most popular listing
            $table->foreignId('most_popular_listing_id')->nullable()->constrained('properties')->onDelete('set null');
            $table->string('most_popular_listing_title')->nullable();
            
            // Inquiry to listing ratio
            $table->decimal('inquiry_to_listing_ratio', 5, 2)->default(0);
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['broker_id', 'report_date']);
            $table->index(['agent_id', 'report_date']);
            $table->index('period_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broker_reports');
    }
};

