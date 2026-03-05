<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $fillable = [
        'owner_type',
        'owner_id',
        'collection',
        'path',
        'sort_order',
        'mime_type',
        'size',
    ];

    /**
     * Get the owning model.
     */
    public function owner()
    {
        return $this->morphTo();
    }
}

