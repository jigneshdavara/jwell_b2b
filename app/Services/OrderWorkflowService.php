<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\WorkOrderStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\WorkOrder;
use Illuminate\Support\Facades\DB;

class OrderWorkflowService
{
    /**
     * Transition an order to the next status and dispatch domain events.
     *
     * @param  Order  $order
     * @param  OrderStatus  $status
     * @param  array<string, mixed>  $meta
     */
    public function transitionOrder(Order $order, OrderStatus $status, array $meta = []): void
    {
        DB::transaction(function () use ($order, $status, $meta) {
            $order->status = $status;
            $order->status_meta = array_merge($order->status_meta ?? [], $meta);
            $order->save();

            OrderStatusUpdated::dispatch($order, $status, $meta);
        });
    }

    /**
     * Synchronize work order status changes with the parent order.
     */
    public function syncWorkOrderStatus(WorkOrder $workOrder, WorkOrderStatus $status): void
    {
        $workOrder->update(['status' => $status]);

        if ($workOrder->order_id && $status === WorkOrderStatus::ReadyToDispatch) {
            $this->transitionOrder($workOrder->order, OrderStatus::ReadyToDispatch);
        }
    }
}

