<?php

namespace Database\Seeders;

use App\Enums\KycStatus;
use App\Enums\UserType;
use App\Models\JobworkRequest;
use App\Models\NotificationLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\WorkOrder;
use Illuminate\Database\Seeder;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::query()
            ->whereIn('type', [UserType::Retailer->value, UserType::Wholesaler->value])
            ->where('kyc_status', KycStatus::Approved->value)
            ->get();

        $products = Product::with(['material', 'variants'])->get();

        $jobworkRequests = JobworkRequest::factory()
            ->count(25)
            ->state(fn () => [
                'user_id' => $customers->random()->id,
            ])
            ->create();

        $jobworkRequests->each(function (JobworkRequest $jobwork) use ($products): void {
            if ($jobwork->submission_mode === 'catalogue' && $products->isNotEmpty()) {
                $product = $products->random();
                $variant = $product->variants->random() ?? null;

                $jobwork->update([
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'metal' => $product->material?->name ?? $jobwork->metal,
                    'purity' => $product->metadata['purity'] ?? $product->material?->purity ?? $jobwork->purity,
                    'metadata' => array_merge($jobwork->metadata ?? [], [
                        'product_snapshot' => [
                            'name' => $product->name,
                            'sku' => $product->sku,
                        ],
                        'variant_snapshot' => $variant ? $variant->only(['label', 'price_adjustment']) : null,
                    ]),
                ]);
            }
        });

        $jobworkRequests->each(function (JobworkRequest $jobwork) use ($products): void {
            $order = WorkOrder::factory()
                ->for($jobwork, 'jobworkRequest')
                ->state(function () use ($jobwork) {
                    return [
                        'assigned_to' => null,
                        'order_id' => null,
                        'status' => $jobwork->status === 'completed' ? 'closed' : 'in_production',
                    ];
                })
                ->create();

            // Log notifications for jobwork status
            NotificationLog::factory()->create([
                'user_id' => $jobwork->user_id,
                'template' => 'jobwork_update',
                'payload' => [
                    'jobwork_id' => $jobwork->id,
                    'work_order_id' => $order->id,
                    'status' => $jobwork->status,
                ],
                'status' => 'sent',
            ]);
        });

        // Supplement with work orders attached to customer orders
        $orders = Order::all();

        $orders->random(min(20, $orders->count()))->each(function (Order $order) use ($products): void {
            $workOrder = WorkOrder::factory()
                ->for($order)
                ->state(fn () => [
                    'jobwork_request_id' => null,
                    'assigned_to' => null,
                ])
                ->create();

            NotificationLog::factory()->create([
                'user_id' => $order->user_id,
                'template' => 'order_workflow',
                'payload' => [
                    'order_id' => $order->id,
                    'work_order_id' => $workOrder->id,
                    'status' => $workOrder->status,
                ],
                'status' => 'queued',
            ]);
        });
    }
}
