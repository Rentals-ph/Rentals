<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\Company;
use App\Models\Media;
use App\Models\News;
use App\Models\Property;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * One-time seeder to migrate existing image columns into the centralized media table.
 *
 * Run ONCE with: php artisan db:seed --class=MigrateImagesToMediaTable
 *
 * This seeder is idempotent — it skips records that already exist in the media table,
 * so running it a second time is safe (but unnecessary).
 *
 * IMPORTANT: getRawOriginal() is used throughout to bypass any accessor that might
 * return the media-table value instead of the raw column value.
 */
class MigrateImagesToMediaTable extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting media table migration...');

        // ── Properties — thumbnail ────────────────────────────────────────────
        $this->command->info('Migrating property thumbnails...');
        Property::whereNotNull('image_path')->orWhereNotNull('image')
            ->each(function (Property $property) {
                $path = $property->getRawOriginal('image_path')
                     ?? $property->getRawOriginal('image');

                if (!$path) {
                    return;
                }

                Media::firstOrCreate([
                    'owner_type' => 'property',
                    'owner_id'   => $property->id,
                    'collection' => 'thumbnail',
                ], [
                    'path'       => $path,
                    'sort_order' => 0,
                ]);
            });

        // ── Properties — gallery JSON ─────────────────────────────────────────
        $this->command->info('Migrating property galleries...');
        Property::whereNotNull('images')->each(function (Property $property) {
            $raw = $property->getRawOriginal('images');

            // The 'images' column has an 'array' cast, but getRawOriginal returns
            // the raw DB value (JSON string or already-decoded value depending on
            // the PDO driver). Handle both.
            if (is_string($raw)) {
                $images = json_decode($raw, true) ?? [];
            } elseif (is_array($raw)) {
                $images = $raw;
            } else {
                $images = [];
            }

            foreach ($images as $index => $path) {
                if (!$path) {
                    continue;
                }

                Media::firstOrCreate([
                    'owner_type' => 'property',
                    'owner_id'   => $property->id,
                    'collection' => 'gallery',
                    'path'       => $path,
                ], [
                    'sort_order' => $index,
                ]);
            }
        });

        // ── Users — avatar ────────────────────────────────────────────────────
        $this->command->info('Migrating user avatars...');
        User::whereNotNull('image_path')->each(function (User $user) {
            $path = $user->getRawOriginal('image_path');

            if (!$path) {
                return;
            }

            Media::firstOrCreate([
                'owner_type' => 'user',
                'owner_id'   => $user->id,
                'collection' => 'avatar',
            ], [
                'path'       => $path,
                'sort_order' => 0,
            ]);
        });

        // ── Users — license document ──────────────────────────────────────────
        $this->command->info('Migrating user license documents...');
        User::whereNotNull('license_document_path')->each(function (User $user) {
            $path = $user->getRawOriginal('license_document_path');

            if (!$path) {
                return;
            }

            Media::firstOrCreate([
                'owner_type' => 'user',
                'owner_id'   => $user->id,
                'collection' => 'license',
            ], [
                'path'       => $path,
                'sort_order' => 0,
            ]);
        });

        // ── Companies — logo ──────────────────────────────────────────────────
        $this->command->info('Migrating company logos...');
        Company::whereNotNull('logo')->each(function (Company $company) {
            $path = $company->getRawOriginal('logo');

            if (!$path) {
                return;
            }

            Media::firstOrCreate([
                'owner_type' => 'company',
                'owner_id'   => $company->id,
                'collection' => 'logo',
            ], [
                'path'       => $path,
                'sort_order' => 0,
            ]);
        });

        // ── Companies — hero image ────────────────────────────────────────────
        $this->command->info('Migrating company hero images...');
        Company::whereNotNull('hero_image')->each(function (Company $company) {
            $path = $company->getRawOriginal('hero_image');

            if (!$path) {
                return;
            }

            Media::firstOrCreate([
                'owner_type' => 'company',
                'owner_id'   => $company->id,
                'collection' => 'hero',
            ], [
                'path'       => $path,
                'sort_order' => 0,
            ]);
        });

        // ── Blogs — thumbnail ─────────────────────────────────────────────────
        $this->command->info('Migrating blog thumbnails...');
        Blog::each(function (Blog $blog) {
            $path = $blog->getRawOriginal('image_path')
                 ?? $blog->getRawOriginal('image');

            if (!$path) {
                return;
            }

            Media::firstOrCreate([
                'owner_type' => 'blog',
                'owner_id'   => $blog->id,
                'collection' => 'thumbnail',
            ], [
                'path'       => $path,
                'sort_order' => 0,
            ]);
        });

        // ── News — thumbnail ──────────────────────────────────────────────────
        $this->command->info('Migrating news thumbnails...');
        News::each(function (News $news) {
            $path = $news->getRawOriginal('image_path')
                 ?? $news->getRawOriginal('image');

            if (!$path) {
                return;
            }

            Media::firstOrCreate([
                'owner_type' => 'news',
                'owner_id'   => $news->id,
                'collection' => 'thumbnail',
            ], [
                'path'       => $path,
                'sort_order' => 0,
            ]);
        });

        // ── Testimonials — avatar ─────────────────────────────────────────────
        $this->command->info('Migrating testimonial avatars...');
        Testimonial::whereNotNull('avatar')->each(function (Testimonial $testimonial) {
            $path = $testimonial->getRawOriginal('avatar');

            if (!$path) {
                return;
            }

            Media::firstOrCreate([
                'owner_type' => 'testimonial',
                'owner_id'   => $testimonial->id,
                'collection' => 'avatar',
            ], [
                'path'       => $path,
                'sort_order' => 0,
            ]);
        });

        $this->command->info('Media table migration completed successfully!');
    }
}

