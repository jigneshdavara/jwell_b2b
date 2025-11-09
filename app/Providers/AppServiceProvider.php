<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);
        Vite::prefetch(concurrency: 3);

        Gate::define('access admin portal', fn (User $user) => in_array($user->type, ['admin', 'super-admin'], true));
        Gate::define('approve kyc', fn (User $user) => in_array($user->type, ['admin', 'super-admin'], true));
        Gate::define('manage products', fn (User $user) => in_array($user->type, ['admin', 'super-admin'], true));
        Gate::define('manage orders', fn (User $user) => in_array($user->type, ['admin', 'super-admin'], true));
        Gate::define('manage offers', fn (User $user) => in_array($user->type, ['admin', 'super-admin'], true));
        Gate::define('manage rates', fn (User $user) => in_array($user->type, ['admin', 'super-admin'], true));
        Gate::define('update production status', fn (User $user) => in_array($user->type, ['production', 'super-admin'], true));
    }
}
