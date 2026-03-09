<?php

namespace App\Providers;

use App\Models\Blog;
use App\Models\BlogComment;
use App\Models\BlogLike;
use App\Models\BlogView;
use App\Models\Company;
use App\Models\News;
use App\Models\NewsComment;
use App\Models\NewsLike;
use App\Models\NewsView;
use App\Models\PageBuilder;
use App\Models\ProfileView;
use App\Models\Property;
use App\Models\PropertyView;
use App\Models\Testimonial;
use App\Models\User;
use App\Observers\BlogCommentObserver;
use App\Observers\BlogLikeObserver;
use App\Observers\BlogViewObserver;
use App\Observers\NewsCommentObserver;
use App\Observers\NewsLikeObserver;
use App\Observers\NewsViewObserver;
use App\Observers\ProfileViewObserver;
use App\Observers\PropertyViewObserver;
use App\Services\GroqService;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(GroqService::class, function () {
            return new GroqService();
        });
    }

    public function boot(): void
    {
        // ─────────────────────────────────────────────────────────────────────
        // Morph map
        // Short, stable string keys instead of fully-qualified class names.
        // ─────────────────────────────────────────────────────────────────────
        Relation::morphMap([
            'property'    => Property::class,
            'user'        => User::class,
            'company'     => Company::class,
            'blog'        => Blog::class,
            'news'        => News::class,
            'testimonial' => Testimonial::class,
            'pagebuilder' => PageBuilder::class,
        ]);

        // ─────────────────────────────────────────────────────────────────────
        // Analytics & engagement observers
        // These maintain the cached counter columns (_count) on parent tables.
        // ─────────────────────────────────────────────────────────────────────
        PropertyView::observe(PropertyViewObserver::class);
        ProfileView::observe(ProfileViewObserver::class);
        BlogView::observe(BlogViewObserver::class);
        NewsView::observe(NewsViewObserver::class);

        BlogLike::observe(BlogLikeObserver::class);
        BlogComment::observe(BlogCommentObserver::class);

        NewsLike::observe(NewsLikeObserver::class);
        NewsComment::observe(NewsCommentObserver::class);

        // Note: HTTP client SSL configuration is handled in individual services
        // (GroqService and ListingAssistantService) to ensure Windows compatibility
    }
}
