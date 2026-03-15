<?php

namespace App\Domain\Content\Observers;

use App\Domain\Content\Models\Blog;
use App\Domain\Content\Models\BlogView;

class BlogViewObserver
{
    public function created(BlogView $view): void
    {
        Blog::where('id', $view->blog_id)->increment('views_count');
    }
}

