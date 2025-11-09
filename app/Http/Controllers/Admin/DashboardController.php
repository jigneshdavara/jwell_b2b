<?php

namespace App\Http\Controllers\Admin;

use App\Enums\KycStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\JobworkRequest;
use App\Models\Offer;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $metrics = [
            'pending_kyc' => User::where('kyc_status', KycStatus::Pending->value)->count(),
            'orders_in_production' => Order::whereIn('status', [
                OrderStatus::InProduction->value,
                OrderStatus::QualityCheck->value,
                OrderStatus::ReadyToDispatch->value,
            ])->count(),
            'active_offers' => Offer::where('is_active', true)->count(),
        ];

        $recentPartners = User::latest()
            ->take(6)
            ->get(['id', 'name', 'email', 'type', 'kyc_status', 'created_at']);

        $jobworkQueue = JobworkRequest::latest()
            ->take(6)
            ->get(['id', 'type', 'status', 'delivery_deadline', 'created_at']);

        return Inertia::render('Admin/Dashboard/Overview', [
            'metrics' => $metrics,
            'recentPartners' => $recentPartners->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'type' => $user->type,
                'kyc_status' => $user->kyc_status,
                'joined_at' => Carbon::parse($user->created_at)->toDateTimeString(),
            ]),
            'jobworkQueue' => $jobworkQueue->map(fn ($request) => [
                'id' => $request->id,
                'type' => $request->type,
                'status' => $request->status,
                'deadline' => optional($request->delivery_deadline)?->toDateString(),
                'created_at' => optional($request->created_at)?->toDateTimeString(),
            ]),
        ]);
    }
}
