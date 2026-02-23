<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Create broker_plans table for credit plans.
     */
    public function up(): void
    {
        Schema::create('broker_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Basic Plan", "Premium Plan"
            $table->text('description')->nullable();
            $table->integer('max_listings')->default(10); // Credit plan: 10 listings
            $table->integer('max_teams')->default(5); // Credit plan: 5 teams
            $table->integer('max_agents')->default(10); // Credit plan: 10 agents
            $table->decimal('price', 10, 2)->default(0);
            $table->string('billing_period')->default('monthly'); // monthly, yearly
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        
        // Insert default credit plan
        DB::table('broker_plans')->insert([
            'name' => 'Credit Plan',
            'description' => 'Default credit plan with 10 listings, 5 teams, and 10 agents',
            'max_listings' => 10,
            'max_teams' => 5,
            'max_agents' => 10,
            'price' => 0,
            'billing_period' => 'monthly',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broker_plans');
    }
};
