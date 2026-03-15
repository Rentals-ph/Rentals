<?php

namespace App\Domain\Content\Observers;

use App\Domain\Content\Models\News;
use App\Domain\Content\Models\NewsComment;

class NewsCommentObserver
{
    public function created(NewsComment $comment): void
    {
        News::where('id', $comment->news_id)->increment('comments_count');
    }
}

