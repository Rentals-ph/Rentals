<?php

namespace App\Observers;

use App\Models\Property;
use App\Models\PropertyView;

class PropertyViewObserver
{
    /**
     * Increment the parent property's cached views_count on each new unique view.
     */
    public function created(PropertyView $view): void
    {
        Property::where('id', $view->property_id)->increment('views_count');
    }
}

