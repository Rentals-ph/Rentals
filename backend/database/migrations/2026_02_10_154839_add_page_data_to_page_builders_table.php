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
        Schema::table('page_builders', function (Blueprint $table) {
            // Add page_data column to store all page customization as JSON
            $table->json('page_data')->nullable()->after('page_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('page_builders', function (Blueprint $table) {
            $table->dropColumn('page_data');
        });
    }
};
