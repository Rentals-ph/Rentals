<?php

namespace App\Observers;

use App\Models\Blog;
use App\Models\BlogLike;

class BlogLikeObserver
{
    public function created(BlogLike $like): void
    {
        Blog::where('id', $like->blog_id)->increment('likes_count');
    }

    public function deleted(BlogLike $like): void
    {
        Blog::where('id', $like->blog_id)->decrement('likes_count');
    }
}

