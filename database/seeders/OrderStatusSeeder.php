<?php

namespace Database\Seeders;

use App\Models\OrderStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrderStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            [
                'name' => 'Pending',
                'color' => '#f59e0b',
                'is_default' => true,
                'position' => 0,
            ],
            [
                'name' => 'Processing',
                'color' => '#3b82f6',
                'position' => 1,
            ],
            [
                'name' => 'Shipped',
                'color' => '#0ea5e9',
                'position' => 2,
            ],
            [
                'name' => 'Completed',
                'color' => '#10b981',
                'position' => 3,
            ],
            [
                'name' => 'Cancelled',
                'color' => '#ef4444',
                'position' => 4,
            ],
            [
                'name' => 'Awaiting materials',
                'color' => '#6366f1',
                'position' => 5,
            ],
            [
                'name' => 'Under production',
                'color' => '#1d4ed8',
                'position' => 6,
            ],
        ];

        foreach ($statuses as $index => $status) {
            OrderStatus::updateOrCreate(
                ['name' => $status['name']],
                [
                    'slug' => Str::slug($status['name']),
                    'color' => $status['color'],
                    'is_default' => $status['is_default'] ?? false,
                    'is_active' => true,
                    'position' => $status['position'] ?? $index,
                ],
            );
        }
    }
}

