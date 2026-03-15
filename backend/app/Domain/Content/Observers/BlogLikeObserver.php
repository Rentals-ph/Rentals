<?php

namespace App\Domain\Content\Observers;

use App\Domain\Content\Models\Blog;
use App\Domain\Content\Models\BlogLike;

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

