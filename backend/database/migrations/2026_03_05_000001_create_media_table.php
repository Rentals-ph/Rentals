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
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('owner_type', 100);
            $table->unsignedBigInteger('owner_id');
            $table->string('collection', 100)->default('default');
            $table->string('path', 500);
            $table->integer('sort_order')->default(0);
            $table->string('mime_type', 100)->nullable();
            $table->integer('size')->nullable();
            $table->timestamps();
            $table->index(['owner_type', 'owner_id', 'collection'], 'idx_owner');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};

