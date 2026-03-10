<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Makes price_type nullable so "for sale" properties don't need a price period.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('price_type', 20)->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('price_type', 20)->nullable(false)->default('Monthly')->change();
        });
    }
};
