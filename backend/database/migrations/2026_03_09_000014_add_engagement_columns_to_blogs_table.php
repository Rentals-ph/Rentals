<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The existing `likes` and `comments` integer columns are kept for
     * backward compatibility.  The new *_count columns are the canonical
     * cached counters going forward.
     */
    public function up(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            if (!Schema::hasColumn('blogs', 'views_count')) {
                $table->unsignedBigInteger('views_count')->default(0)->after('comments');
            }
            if (!Schema::hasColumn('blogs', 'likes_count')) {
                $table->unsignedBigInteger('likes_count')->default(0)->after('views_count');
            }
            if (!Schema::hasColumn('blogs', 'comments_count')) {
                $table->unsignedBigInteger('comments_count')->default(0)->after('likes_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->dropColumn(['views_count', 'likes_count', 'comments_count']);
        });
    }
};

