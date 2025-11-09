<?php

namespace App\Http\Controllers\Production;

use App\Http\Controllers\Controller;
use App\Models\JobworkRequest;
use App\Models\WorkOrder;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $metrics = [
            'in_queue' => WorkOrder::whereIn('status', ['queued', 'in_production'])->count(),
            'quality_check' => WorkOrder::where('status', 'qc')->count(),
            'dispatch_ready' => WorkOrder::where('status', 'ready_to_dispatch')->count(),
        ];

        $activeWorkOrders = WorkOrder::latest()
            ->with('order')
            ->take(6)
            ->get()
            ->map(fn (WorkOrder $workOrder) => [
                'id' => $workOrder->id,
                'code' => $workOrder->work_order_code,
                'status' => $workOrder->status,
                'stage_notes' => $workOrder->stage_notes,
                'deadline' => optional($workOrder->delivery_deadline)?->toDateString(),
                'order_reference' => optional($workOrder->order)->reference,
            ]);

        $jobworkHandovers = JobworkRequest::whereNull('converted_work_order_id')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (JobworkRequest $request) => [
                'id' => $request->id,
                'status' => $request->status,
                'quantity' => $request->quantity,
                'metal' => $request->metal,
                'deadline' => optional($request->delivery_deadline)?->toDateString(),
            ]);

        return Inertia::render('Production/Dashboard/Overview', [
            'metrics' => $metrics,
            'activeWorkOrders' => $activeWorkOrders,
            'jobworkHandovers' => $jobworkHandovers,
        ]);
    }
}
