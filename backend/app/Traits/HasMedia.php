<?php

namespace App\Traits;

use App\Domain\Properties\Models\Media;

trait HasMedia
{
    /**
     * Get all media for this model.
     */
    public function media()
    {
        return $this->morphMany(Media::class, 'owner');
    }

    /**
     * Get all media items for a given collection, ordered by sort_order.
     */
    public function getMedia(string $collection = 'default')
    {
        return $this->media()
                    ->where('collection', $collection)
                    ->orderBy('sort_order')
                    ->get();
    }

    /**
     * Get the first media item for a given collection.
     */
    public function getFirstMedia(string $collection = 'default')
    {
        return $this->media()
                    ->where('collection', $collection)
                    ->orderBy('sort_order')
                    ->first();
    }

    /**
     * Get the path of the first media item for a given collection.
     */
    public function getFirstMediaPath(string $collection = 'default'): ?string
    {
        return $this->getFirstMedia($collection)?->path;
    }

    /**
     * Store a new media item for this model.
     */
    public function storeMedia(
        string $path,
        string $collection = 'default',
        int $sortOrder = 0,
        ?string $mimeType = null,
        ?int $size = null
    ): Media {
        return $this->media()->create([
            'owner_type' => strtolower(class_basename($this)),
            'owner_id'   => $this->id,
            'collection' => $collection,
            'path'       => $path,
            'sort_order' => $sortOrder,
            'mime_type'  => $mimeType,
            'size'       => $size,
        ]);
    }

    /**
     * Delete all media items for a given collection.
     */
    public function deleteMedia(string $collection): void
    {
        $this->media()->where('collection', $collection)->delete();
    }
}

