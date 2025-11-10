<?php

namespace App\Http\Controllers\Frontend;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Quotation;
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
            'jobwork_requests' => Quotation::where('user_id', $user->id)
                ->where('mode', 'jobwork')
                ->where('status', 'approved')
                ->count(),
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

        $jobworkTimeline = Quotation::where('user_id', $user->id)
            ->where('mode', 'jobwork')
            ->where('status', 'approved')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Quotation $quotation) => [
                'id' => $quotation->id,
                'status' => $quotation->jobwork_status,
                'product' => optional($quotation->product)?->name,
                'quantity' => $quotation->quantity,
                'submitted_on' => optional($quotation->created_at)?->toDateTimeString(),
            ]);

        $dueOrders = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::PendingPayment->value)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Order $order) => [
                'reference' => $order->reference,
                'total' => (float) $order->total_amount,
                'placed_on' => optional($order->created_at)?->toDateTimeString(),
            ]);

        return Inertia::render('Frontend/Dashboard/Overview', [
            'stats' => $stats,
            'recentOrders' => $recentOrders,
            'jobworkTimeline' => $jobworkTimeline,
            'dueOrders' => $dueOrders,
        ]);
    }
}
