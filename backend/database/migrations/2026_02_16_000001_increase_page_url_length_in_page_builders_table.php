<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_builders', function (Blueprint $table) {
            // Change page_url from string (VARCHAR 255) to text to support longer URLs
            $table->text('page_url')->nullable()->change();
            
            // Change image fields to longText to support base64 data URLs (which can be very long, up to 4GB)
            $table->longText('profile_image')->nullable()->change();
            $table->longText('hero_image')->nullable()->change();
            $table->longText('profile_card_image')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('page_builders', function (Blueprint $table) {
            $table->string('page_url')->nullable()->change();
            $table->string('profile_image', 500)->nullable()->change();
            $table->string('hero_image', 500)->nullable()->change();
            $table->string('profile_card_image', 500)->nullable()->change();
        });
    }
};

