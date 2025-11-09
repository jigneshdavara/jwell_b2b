<?php

namespace App\Http\Controllers\Frontend;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\JobworkRequest;
use App\Models\Offer;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = Auth::user();

        $openOrderStatuses = [
            OrderStatus::Pending->value,
            OrderStatus::Approved->value,
            OrderStatus::InProduction->value,
            OrderStatus::QualityCheck->value,
            OrderStatus::ReadyToDispatch->value,
        ];

        $stats = [
            'open_orders' => Order::where('user_id', $user->id)
                ->whereIn('status', $openOrderStatuses)
                ->count(),
            'jobwork_requests' => JobworkRequest::where('user_id', $user->id)->count(),
            'active_offers' => Offer::where('is_active', true)->count(),
        ];

        $recentOrders = Order::withCount('items')
            ->where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Order $order) => [
                'reference' => $order->reference,
                'status' => $order->status,
                'total' => (float) $order->total_amount,
                'items' => $order->items_count,
                'placed_on' => Carbon::parse($order->created_at)->toDateTimeString(),
            ]);

        $jobworkTimeline = JobworkRequest::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (JobworkRequest $request) => [
                'id' => $request->id,
                'status' => $request->status,
                'metal' => $request->metal,
                'purity' => $request->purity,
                'quantity' => $request->quantity,
                'deadline' => optional($request->delivery_deadline)?->toDateString(),
                'submitted_on' => optional($request->created_at)?->toDateTimeString(),
            ]);

        return Inertia::render('Frontend/Dashboard/Overview', [
            'stats' => $stats,
            'recentOrders' => $recentOrders,
            'jobworkTimeline' => $jobworkTimeline,
        ]);
    }
}
