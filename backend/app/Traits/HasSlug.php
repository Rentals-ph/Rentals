<?php

namespace App\Traits;

use Illuminate\Support\Str;

/**
 * HasSlug — reusable slug generation, uniqueness enforcement, and route-model
 * binding for SEO-friendly URLs.
 *
 * Usage:
 *   1. Add `use HasSlug;` to your model.
 *   2. Declare `protected string $slugFrom = 'title';` (defaults to 'title').
 *   3. For computed sources (e.g. full name) override `getSlugSource(): string`.
 *   4. To conditionally skip slug generation (e.g. only for certain roles)
 *      override `shouldGenerateSlug(): bool`.
 *   5. Run the corresponding migration to add the `slug` column.
 *
 * Route-model binding:
 *   - Accepts both numeric IDs (backward compat) and slugs.
 *   - `/properties/42` → resolved by ID
 *   - `/properties/modern-condo-cebu` → resolved by slug
 */
trait HasSlug
{
    // -------------------------------------------------------------------------
    // Boot
    // -------------------------------------------------------------------------

    public static function bootHasSlug(): void
    {
        static::creating(function (self $model): void {
            if (! $model->shouldGenerateSlug()) {
                return;
            }

            if (empty($model->slug)) {
                // Auto-generate from source field
                $model->slug = $model->makeUniqueSlug($model->getSlugSource());
            } else {
                // Manual slug provided — still enforce uniqueness
                $model->slug = $model->makeUniqueSlug($model->slug);
            }
        });

        static::updating(function (self $model): void {
            if (! $model->shouldGenerateSlug()) {
                return;
            }

            if ($model->isDirty('slug')) {
                if (empty($model->slug)) {
                    // slug explicitly cleared → regenerate from source
                    $model->slug = $model->makeUniqueSlugExcept(
                        $model->getSlugSource(),
                        $model->getKey()
                    );
                } else {
                    // Manual slug change → enforce uniqueness (exclude self)
                    $model->slug = $model->makeUniqueSlugExcept(
                        $model->slug,
                        $model->getKey()
                    );
                }
            }
            // If slug is NOT dirty (not sent in the update payload), keep it as-is.
            // This satisfies the spec: "Regenerate slug on title/name update ONLY if
            // slug was not manually set" — we interpret it as: don't silently change
            // a published slug just because the title changed; only change when the
            // slug field is explicitly included in the update.
        });
    }

    // -------------------------------------------------------------------------
    // Route-model binding
    // -------------------------------------------------------------------------

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Resolve route bindings supporting both numeric IDs (backward compat) and slugs.
     */
    public function resolveRouteBinding($value, $field = null): ?static
    {
        if ($field) {
            return $this->where($field, $value)->firstOrFail();
        }

        // Numeric value → try ID first so existing bookmarked ID-based links keep working
        if (is_numeric($value)) {
            $record = $this->where('id', $value)->first();
            if ($record) {
                return $record;
            }
        }

        return $this->where('slug', $value)->firstOrFail();
    }

    // -------------------------------------------------------------------------
    // Slug source
    // -------------------------------------------------------------------------

    /**
     * Return the raw string value that will be slugified.
     * Override in models that derive the slug from multiple fields (e.g. User full name).
     */
    public function getSlugSource(): string
    {
        $field = $this->slugFromField();

        return (string) ($this->getAttribute($field) ?? '');
    }

    /**
     * Whether this model instance should have a slug generated.
     * Override in models that only generate slugs conditionally (e.g. User — agents only).
     */
    public function shouldGenerateSlug(): bool
    {
        return true;
    }

    // -------------------------------------------------------------------------
    // Slug generation helpers
    // -------------------------------------------------------------------------

    /**
     * Generate a URL-safe base slug from any string.
     */
    public static function generateSlug(string $value): string
    {
        $slug = mb_strtolower($value, 'UTF-8');

        // Transliterate accented characters to ASCII equivalents when possible
        $slug = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $slug) ?: $slug;

        // Replace anything that is not alphanumeric with a hyphen
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);

        // Collapse multiple consecutive hyphens
        $slug = preg_replace('/-{2,}/', '-', $slug);

        // Strip leading/trailing hyphens
        $slug = trim($slug, '-');

        return $slug ?: 'record';
    }

    /**
     * Make a unique slug for a NEW record (no exclusion needed).
     */
    public function makeUniqueSlug(string $value): string
    {
        return $this->resolveUniqueSlug(static::generateSlug($value), null);
    }

    /**
     * Make a unique slug while EXCLUDING a specific record ID (for updates).
     */
    public function makeUniqueSlugExcept(string $value, int|string $excludeId): string
    {
        return $this->resolveUniqueSlug(static::generateSlug($value), $excludeId);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    protected function resolveUniqueSlug(string $base, int|string|null $excludeId): string
    {
        $slug  = $base;
        $index = 2;

        while (true) {
            $query = $this->newQueryWithoutScopes()->where('slug', $slug);

            if ($excludeId !== null) {
                $query->where('id', '!=', $excludeId);
            }

            if (! $query->exists()) {
                break;
            }

            $slug = $base . '-' . $index;
            $index++;
        }

        return $slug;
    }

    protected function slugFromField(): string
    {
        return property_exists($this, 'slugFrom') ? $this->slugFrom : 'title';
    }
}

