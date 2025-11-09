<?php

namespace App\Http\Controllers\Production;

use App\Enums\WorkOrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Production\UpdateWorkOrderStatusRequest;
use App\Models\WorkOrder;
use App\Services\OrderWorkflowService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WorkOrderController extends Controller
{
    public function __construct(
        protected OrderWorkflowService $orderWorkflowService
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('Production/WorkOrders/Index', [
            'workOrders' => WorkOrder::query()->with(['order', 'jobworkRequest'])->paginate(20),
            'statuses' => collect(WorkOrderStatus::cases())->pluck('value'),
        ]);
    }

    public function updateStatus(UpdateWorkOrderStatusRequest $request, WorkOrder $workOrder): RedirectResponse
    {
        $this->orderWorkflowService->syncWorkOrderStatus(
            $workOrder,
            WorkOrderStatus::from($request->get('status'))
        );

        return redirect()
            ->back()
            ->with('status', 'work_order_status_updated');
    }
}
