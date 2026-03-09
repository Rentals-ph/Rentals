<?php

namespace App\Observers;

use App\Models\News;
use App\Models\NewsComment;

class NewsCommentObserver
{
    public function created(NewsComment $comment): void
    {
        News::where('id', $comment->news_id)->increment('comments_count');
    }
}

