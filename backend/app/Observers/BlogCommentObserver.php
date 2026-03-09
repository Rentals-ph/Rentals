<?php

namespace App\Observers;

use App\Models\Blog;
use App\Models\BlogComment;

class BlogCommentObserver
{
    /**
     * Increment blog comments_count when a comment is created.
     * Decrement is handled manually in the controller so we can account for
     * cascaded child-comment deletions that bypass Eloquent.
     */
    public function created(BlogComment $comment): void
    {
        Blog::where('id', $comment->blog_id)->increment('comments_count');
    }
}

