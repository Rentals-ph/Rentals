<?php

namespace App\Observers;

use App\Models\ProfileView;
use App\Models\User;

class ProfileViewObserver
{
    /**
     * Increment the viewed user's cached views_count.
     * The morph map guarantees viewable_type = 'user', so we always target users.
     */
    public function created(ProfileView $view): void
    {
        User::where('id', $view->viewable_id)->increment('views_count');
    }
}

