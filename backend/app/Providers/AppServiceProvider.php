<?php

namespace App\Providers;

use App\Domain\Content\Models\Blog;
use App\Domain\Content\Models\BlogComment;
use App\Domain\Content\Models\BlogLike;
use App\Domain\Content\Models\BlogView;
use App\Domain\Users\Models\Company;
use App\Domain\Content\Models\News;
use App\Domain\Content\Models\NewsComment;
use App\Domain\Content\Models\NewsLike;
use App\Domain\Content\Models\NewsView;
use App\Domain\Content\Models\PageBuilder;
use App\Domain\Users\Models\ProfileView;
use App\Domain\Properties\Models\Property;
use App\Domain\Properties\Models\PropertyView;
use App\Domain\Content\Models\Testimonial;
use App\Domain\Users\Models\User;
use App\Domain\Content\Observers\BlogCommentObserver;
use App\Domain\Content\Observers\BlogLikeObserver;
use App\Domain\Content\Observers\BlogViewObserver;
use App\Domain\Content\Observers\NewsCommentObserver;
use App\Domain\Content\Observers\NewsLikeObserver;
use App\Domain\Content\Observers\NewsViewObserver;
use App\Domain\Users\Observers\ProfileViewObserver;
use App\Domain\Properties\Observers\PropertyViewObserver;
use App\Domain\AI\Services\GroqService;
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
