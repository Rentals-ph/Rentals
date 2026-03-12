<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('downloadables', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path'); // Path to file in storage
            $table->string('file_name'); // Original filename
            $table->string('file_type')->nullable(); // MIME type
            $table->integer('file_size')->nullable(); // Size in bytes
            $table->string('category')->nullable(); // e.g., 'lease-agreements', 'financial-reports', 'property-photos'
            $table->boolean('is_active')->default(true);
            $table->integer('download_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('downloadables');
    }
};

