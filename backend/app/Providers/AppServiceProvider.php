<?php

namespace App\Providers;

use App\Models\Blog;
use App\Models\Company;
use App\Models\News;
use App\Models\PageBuilder;
use App\Models\Property;
use App\Models\Testimonial;
use App\Models\User;
use App\Services\GroqService;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Http;

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
        // Register morph map so the media table uses short lowercase keys
        // instead of fully-qualified class names as owner_type values.
        Relation::morphMap([
            'property'    => Property::class,
            'user'        => User::class,
            'company'     => Company::class,
            'blog'        => Blog::class,
            'news'        => News::class,
            'testimonial' => Testimonial::class,
            'pagebuilder' => PageBuilder::class,
        ]);

        // Note: HTTP client SSL configuration is handled in individual services
        // (GroqService and ListingAssistantService) to ensure Windows compatibility
    }
}
