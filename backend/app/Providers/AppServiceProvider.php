<?php

namespace App\Providers;

use App\Services\GroqService;
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
        //
    }
}

