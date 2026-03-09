<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Slug is only populated for agents and brokers; all other roles remain NULL.
            $table->string('slug')->nullable()->unique()->after('last_name');
        });

        $this->backfillSlugs();
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
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

            return $slug ?: 'user';
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

        // Only backfill for agents and brokers
        DB::table('users')
            ->whereIn('role', ['agent', 'broker'])
            ->orderBy('id')
            ->each(function ($user) use ($generateSlug, $makeUnique) {
                if (! empty($user->slug)) {
                    return;
                }

                $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                if ($name === '') {
                    return; // Skip users with no name
                }

                $slug = $makeUnique($generateSlug($name));

                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['slug' => $slug]);
            });
    }
};

