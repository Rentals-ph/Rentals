<?php

namespace App\Observers;

use App\Models\Blog;
use App\Models\BlogView;

class BlogViewObserver
{
    public function created(BlogView $view): void
    {
        Blog::where('id', $view->blog_id)->increment('views_count');
    }
}

