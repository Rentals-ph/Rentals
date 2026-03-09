<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('title');
        });

        $this->backfillSlugs();
    }

    public function down(): void
    {
        Schema::table('blogs', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }

    // -------------------------------------------------------------------------

    private function backfillSlugs(): void
    {
        $usedSlugs = [];

        $generateSlug = static function (string $value): string {
            $slug = mb_strtolower($value, 'UTF-8');
            $slug = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug) ?: $slug;
            $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
            $slug = preg_replace('/-{2,}/', '-', $slug);
            $slug = trim($slug, '-');

            return $slug ?: 'blog';
        };

        $makeUnique = static function (string $base) use (&$usedSlugs): string {
            $slug  = $base;
            $index = 2;
            while (in_array($slug, $usedSlugs, true)) {
                $slug = $base . '-' . $index;
                $index++;
            }
            $usedSlugs[] = $slug;

            return $slug;
        };

        DB::table('blogs')
            ->orderBy('id')
            ->each(function ($blog) use ($generateSlug, $makeUnique) {
                if (! empty($blog->slug)) {
                    return;
                }

                $slug = $makeUnique($generateSlug($blog->title ?? ''));

                DB::table('blogs')
                    ->where('id', $blog->id)
                    ->update(['slug' => $slug]);
            });
    }
};

