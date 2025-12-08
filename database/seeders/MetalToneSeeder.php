<?php

namespace Database\Seeders;

use App\Models\Metal;
use App\Models\MetalTone;
use Illuminate\Database\Seeder;

class MetalToneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tones = [
            // Gold tones - from image
            ['metal' => 'Gold', 'code' => 'Y', 'name' => 'Yellow Gold', 'display_order' => 1],
            ['metal' => 'Gold', 'code' => 'P', 'name' => 'Rose Gold', 'display_order' => 2],
            ['metal' => 'Gold', 'code' => 'W', 'name' => 'White Gold', 'display_order' => 3],
            ['metal' => 'Gold', 'code' => 'Y-W', 'name' => 'Yellow & White Gold', 'display_order' => 4],
            ['metal' => 'Gold', 'code' => 'P-W', 'name' => 'Rose & White gold', 'display_order' => 5],
            ['metal' => 'Gold', 'code' => 'P-W-Y', 'name' => 'Rose & White & Yellow Gold', 'display_order' => 6],
            ['metal' => 'Gold', 'code' => 'YW', 'name' => 'Yellow/White Gold', 'display_order' => 7],
            ['metal' => 'Gold', 'code' => 'PW', 'name' => 'Rose/White Gold', 'display_order' => 8],
            ['metal' => 'Gold', 'code' => 'PW-Y', 'name' => 'Rose/White & Yellow Gold', 'display_order' => 9],
            ['metal' => 'Gold', 'code' => 'YW-P', 'name' => 'Yellow/White & Rose Gold', 'display_order' => 10],
            ['metal' => 'Gold', 'code' => 'P-Y', 'name' => 'Rose & Yellow Gold', 'display_order' => 11],
            ['metal' => 'Gold', 'code' => 'PW-YW', 'name' => 'Rose/White & Yellow/White Gold', 'display_order' => 12],
            ['metal' => 'Gold', 'code' => 'MIX', 'name' => 'Mixed Gold', 'display_order' => 13],
            ['metal' => 'Gold', 'code' => 'YW-W', 'name' => 'Yellow/White & White Gold', 'display_order' => 14],
            ['metal' => 'Gold', 'code' => 'PW-W', 'name' => 'Pink/White & White Gold', 'display_order' => 15],
            // Silver tones
            ['metal' => 'Silver', 'code' => 'SL', 'name' => 'Silver', 'display_order' => 1],
            ['metal' => 'Silver', 'code' => 'OX', 'name' => 'Oxidized Silver', 'display_order' => 2],
            // Platinum tones
            ['metal' => 'Platinum', 'code' => 'PT', 'name' => 'Platinum', 'display_order' => 1],
        ];

        foreach ($tones as $tone) {
            $metal = Metal::where('name', $tone['metal'])->first();

            if ($metal) {
                MetalTone::updateOrCreate(
                    [
                        'metal_id' => $metal->id,
                        'name' => $tone['name'],
                    ],
                    [
                        'code' => $tone['code'],
                        'is_active' => true,
                        'display_order' => $tone['display_order'],
                    ]
                );
            }
        }
    }
}
