<?php

namespace App\Providers;

use App\Services\GroqService;
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
        // Note: HTTP client SSL configuration is handled in individual services
        // (GroqService and ListingAssistantService) to ensure Windows compatibility
    }
}

