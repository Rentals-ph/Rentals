<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blog_id')->constrained('blogs')->onDelete('cascade');
            // Either user_id OR guest_session_id will be set; application enforces uniqueness
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('guest_session_id')->nullable()->constrained('guest_sessions')->onDelete('cascade');
            $table->timestamps();

            $table->index(['blog_id', 'user_id']);
            $table->index(['blog_id', 'guest_session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_likes');
    }
};

