<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            if (!Schema::hasColumn('news', 'views_count')) {
                $table->unsignedBigInteger('views_count')->default(0)->after('published_at');
            }
            if (!Schema::hasColumn('news', 'likes_count')) {
                $table->unsignedBigInteger('likes_count')->default(0)->after('views_count');
            }
            if (!Schema::hasColumn('news', 'comments_count')) {
                $table->unsignedBigInteger('comments_count')->default(0)->after('likes_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->dropColumn(['views_count', 'likes_count', 'comments_count']);
        });
    }
};

