<?php

namespace App\Domain\Content\Observers;

use App\Domain\Content\Models\News;
use App\Domain\Content\Models\NewsView;

class NewsViewObserver
{
    public function created(NewsView $view): void
    {
        News::where('id', $view->news_id)->increment('views_count');
    }
}

