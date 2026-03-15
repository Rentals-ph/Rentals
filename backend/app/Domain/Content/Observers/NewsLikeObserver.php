<?php

namespace App\Domain\Content\Observers;

use App\Domain\Content\Models\News;
use App\Domain\Content\Models\NewsLike;

class NewsLikeObserver
{
    public function created(NewsLike $like): void
    {
        News::where('id', $like->news_id)->increment('likes_count');
    }

    public function deleted(NewsLike $like): void
    {
        News::where('id', $like->news_id)->decrement('likes_count');
    }
}

