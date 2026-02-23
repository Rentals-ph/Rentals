<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_builders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('user_type', ['agent', 'broker'])->default('agent');
            $table->enum('page_type', ['profile', 'property'])->default('profile');
            $table->string('page_slug')->unique()->nullable();
            $table->string('page_url')->nullable();
            
            // Profile mode fields
            $table->string('selected_theme')->default('white');
            $table->text('bio')->nullable();
            $table->boolean('show_bio')->default(true);
            $table->boolean('show_contact_number')->default(true);
            $table->boolean('show_experience_stats')->default(false);
            $table->boolean('show_featured_listings')->default(true);
            $table->boolean('show_testimonials')->default(true);
            $table->string('profile_image')->nullable();
            
            // Contact information (JSON)
            $table->json('contact_info')->nullable();
            
            // Experience stats (JSON)
            $table->json('experience_stats')->nullable();
            
            // Property mode fields
            $table->string('hero_image')->nullable();
            $table->string('main_heading')->nullable();
            $table->string('tagline')->nullable();
            $table->integer('overall_darkness')->default(30);
            $table->text('property_description')->nullable();
            $table->json('property_images')->nullable();
            $table->string('property_price')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            
            // Profile card fields
            $table->string('profile_card_name')->nullable();
            $table->string('profile_card_role')->nullable();
            $table->text('profile_card_bio')->nullable();
            $table->string('profile_card_image')->nullable();
            
            // Section visibility (JSON)
            $table->json('section_visibility')->nullable();
            
            // Layout sections (JSON)
            $table->json('layout_sections')->nullable();
            
            // Design settings
            $table->string('selected_brand_color')->default('white');
            $table->string('selected_corner_radius')->default('soft');
            
            // Featured listings (JSON) - for future use
            $table->json('featured_listings')->nullable();
            
            // Testimonials (JSON) - for future use
            $table->json('testimonials')->nullable();
            
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['user_id', 'user_type', 'page_type']);
            $table->index('page_slug');
            $table->index('is_published');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_builders');
    }
};
