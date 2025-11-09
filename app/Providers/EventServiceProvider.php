<?php

namespace App\Providers;

use App\Events\OrderConfirmed;
use App\Listeners\NotifyAdminOfNewOrder;
use App\Listeners\NotifyAdminOfRegistration;
use App\Listeners\SendOrderConfirmationEmail;
use App\Listeners\SendWelcomeEmail;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendWelcomeEmail::class,
            NotifyAdminOfRegistration::class,
        ],
        OrderConfirmed::class => [
            SendOrderConfirmationEmail::class,
            NotifyAdminOfNewOrder::class,
        ],
    ];
}
