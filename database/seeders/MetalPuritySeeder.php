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
            ['metal' => 'gold', 'label' => '18K', 'position' => 1],
            ['metal' => 'gold', 'label' => '22K', 'position' => 2],
            ['metal' => 'gold', 'label' => '24K', 'position' => 3],
            // Silver purities
            ['metal' => 'silver', 'label' => '925', 'position' => 1],
            ['metal' => 'silver', 'label' => '999', 'position' => 2],
            // Platinum purities
            ['metal' => 'platinum', 'label' => '950', 'position' => 1],
        ];

        foreach ($purities as $purity) {
            $metal = Metal::where('slug', $purity['metal'])->first();

            if ($metal) {
                MetalPurity::updateOrCreate(
                    [
                        'metal_id' => $metal->id,
                        'label' => $purity['label'],
                    ],
                    [
                        'is_active' => true,
                        'position' => $purity['position'],
                    ]
                );
            }
        }
    }
}
