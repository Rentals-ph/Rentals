<?php

namespace App\Observers;

use App\Models\News;
use App\Models\NewsView;

class NewsViewObserver
{
    public function created(NewsView $view): void
    {
        News::where('id', $view->news_id)->increment('views_count');
    }
}

