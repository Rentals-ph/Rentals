<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('title');
        });

        $this->backfillSlugs();
    }

    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
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

            return $slug ?: 'news';
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

        DB::table('news')
            ->orderBy('id')
            ->each(function ($news) use ($generateSlug, $makeUnique) {
                if (! empty($news->slug)) {
                    return;
                }

                $slug = $makeUnique($generateSlug($news->title ?? ''));

                DB::table('news')
                    ->where('id', $news->id)
                    ->update(['slug' => $slug]);
            });
    }
};

