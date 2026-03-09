<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_id')->constrained('news')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('guest_session_id')->nullable()->constrained('guest_sessions')->onDelete('cascade');
            $table->timestamps();

            $table->index(['news_id', 'user_id']);
            $table->index(['news_id', 'guest_session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_likes');
    }
};

