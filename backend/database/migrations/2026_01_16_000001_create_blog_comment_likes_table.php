<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_comment_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained('blog_comments')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('guest_session_id')->nullable()->constrained('guest_sessions')->onDelete('set null');
            $table->timestamps();

            // Prevent duplicate likes from same user/guest
            $table->unique(['comment_id', 'user_id'], 'unique_user_like');
            $table->unique(['comment_id', 'guest_session_id'], 'unique_guest_like');
            $table->index('comment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_comment_likes');
    }
};

