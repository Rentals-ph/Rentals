<?php

namespace App\Domain\Properties\Observers;

use App\Domain\Properties\Models\Property;
use App\Domain\Properties\Models\PropertyView;

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

