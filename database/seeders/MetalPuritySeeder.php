<?php

namespace Database\Seeders;

use App\Models\Metal;
use App\Models\MetalPurity;
use Illuminate\Database\Seeder;

class MetalPuritySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $purities = [
            // Gold purities
            ['metal' => 'Gold', 'code' => '18K', 'name' => '18K', 'display_order' => 1],
            ['metal' => 'Gold', 'code' => '22K', 'name' => '22K', 'display_order' => 2],
            ['metal' => 'Gold', 'code' => '24K', 'name' => '24K', 'display_order' => 3],
            // Silver purities
            ['metal' => 'Silver', 'code' => '925', 'name' => '925', 'display_order' => 1],
            ['metal' => 'Silver', 'code' => '999', 'name' => '999', 'display_order' => 2],
            // Platinum purities
            ['metal' => 'Platinum', 'code' => '950', 'name' => '950', 'display_order' => 1],
        ];

        foreach ($purities as $purity) {
            $metal = Metal::where('name', $purity['metal'])->first();

            if ($metal) {
                MetalPurity::updateOrCreate(
                    [
                        'metal_id' => $metal->id,
                        'name' => $purity['name'],
                    ],
                    [
                        'code' => $purity['code'],
                        'is_active' => true,
                        'display_order' => $purity['display_order'],
                    ]
                );
            }
        }
    }
}
