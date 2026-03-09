<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('title');
        });

        // Backfill slugs for all existing properties
        $this->backfillSlugs();
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
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

            return $slug ?: 'property';
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

        DB::table('properties')
            ->orderBy('id')
            ->each(function ($property) use ($generateSlug, $makeUnique) {
                if (! empty($property->slug)) {
                    return;
                }

                $base = $generateSlug($property->title ?? '');
                $slug = $makeUnique($base);

                DB::table('properties')
                    ->where('id', $property->id)
                    ->update(['slug' => $slug]);
            });
    }
};

