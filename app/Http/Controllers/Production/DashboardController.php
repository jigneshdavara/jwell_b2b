<?php

namespace App\Http\Controllers\Production;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $metrics = [
            'in_queue' => 0,
            'quality_check' => 0,
            'dispatch_ready' => 0,
        ];

        return Inertia::render('Production/Dashboard/Overview', [
            'metrics' => $metrics,
        ]);
    }
}
