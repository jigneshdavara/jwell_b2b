<?php

namespace Database\Seeders;

use App\Models\Metal;
use App\Models\MetalPurity;
use App\Models\MetalTone;
use Illuminate\Database\Seeder;

class MetalDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedMetals();
        $this->seedMetalTones();
        $this->seedMetalPurities();
    }

    protected function seedMetals(): void
    {
        $this->command->info('Seeding metals...');

        $metals = [
            [
                'code' => 'AU',
                'name' => 'Gold',
                'description' => null,
                'display_order' => 1,
            ],
            [
                'code' => 'AG',
                'name' => 'Silver',
                'description' => null,
                'display_order' => 2,
            ],
            [
                'code' => 'PT',
                'name' => 'Platinum',
                'description' => null,
                'display_order' => 3,
            ],
        ];

        foreach ($metals as $metal) {
            Metal::updateOrCreate(
                ['name' => $metal['name']],
                [
                    'code' => $metal['code'],
                    'description' => $metal['description'],
                    'is_active' => true,
                    'display_order' => $metal['display_order'],
                ]
            );
        }

        $this->command->info('Imported ' . count($metals) . ' metals.');
    }

    protected function seedMetalTones(): void
    {
        $this->command->info('Seeding metal tones...');

        // Get metals
        $gold = Metal::where('name', 'Gold')->first();
        $silver = Metal::where('name', 'Silver')->first();
        $platinum = Metal::where('name', 'Platinum')->first();

        if (!$gold || !$silver || !$platinum) {
            $this->command->error('Metals must be seeded before tones.');
            return;
        }

        $tones = [
            // Gold tones
            ['metal_id' => $gold->id, 'code' => 'Y', 'name' => 'Yellow Gold', 'display_order' => 1],
            ['metal_id' => $gold->id, 'code' => 'P', 'name' => 'Rose Gold', 'display_order' => 2],
            ['metal_id' => $gold->id, 'code' => 'W', 'name' => 'White Gold', 'display_order' => 3],
            ['metal_id' => $gold->id, 'code' => 'Y-W', 'name' => 'Yellow & White Gold', 'display_order' => 4],
            ['metal_id' => $gold->id, 'code' => 'P-W', 'name' => 'Rose & White gold', 'display_order' => 5],
            ['metal_id' => $gold->id, 'code' => 'P-W-Y', 'name' => 'Rose & White & Yellow Gold', 'display_order' => 6],
            ['metal_id' => $gold->id, 'code' => 'YW', 'name' => 'Yellow/White Gold', 'display_order' => 7],
            ['metal_id' => $gold->id, 'code' => 'PW', 'name' => 'Rose/White Gold', 'display_order' => 8],
            ['metal_id' => $gold->id, 'code' => 'PW-Y', 'name' => 'Rose/White & Yellow Gold', 'display_order' => 9],
            ['metal_id' => $gold->id, 'code' => 'YW-P', 'name' => 'Yellow/White & Rose Gold', 'display_order' => 10],
            ['metal_id' => $gold->id, 'code' => 'P-Y', 'name' => 'Rose & Yellow Gold', 'display_order' => 11],
            ['metal_id' => $gold->id, 'code' => 'PW-YW', 'name' => 'Rose/White & Yellow/White Gold', 'display_order' => 12],
            ['metal_id' => $gold->id, 'code' => 'MIX', 'name' => 'Mixed Gold', 'display_order' => 13],
            ['metal_id' => $gold->id, 'code' => 'YW-W', 'name' => 'Yellow/White & White Gold', 'display_order' => 14],
            ['metal_id' => $gold->id, 'code' => 'PW-W', 'name' => 'Pink/White & White Gold', 'display_order' => 15],
            // Silver tones
            ['metal_id' => $silver->id, 'code' => 'SL', 'name' => 'Silver', 'display_order' => 1],
            ['metal_id' => $silver->id, 'code' => 'OX', 'name' => 'Oxidized Silver', 'display_order' => 2],
            // Platinum tones
            ['metal_id' => $platinum->id, 'code' => 'PT', 'name' => 'Platinum', 'display_order' => 1],
        ];

        foreach ($tones as $tone) {
            MetalTone::updateOrCreate(
                [
                    'metal_id' => $tone['metal_id'],
                    'name' => $tone['name'],
                ],
                [
                    'code' => $tone['code'],
                    'is_active' => true,
                    'display_order' => $tone['display_order'],
                ]
            );
        }

        $this->command->info('Imported ' . count($tones) . ' metal tones.');
    }

    protected function seedMetalPurities(): void
    {
        $this->command->info('Seeding metal purities...');

        // Get metals
        $gold = Metal::where('name', 'Gold')->first();
        $silver = Metal::where('name', 'Silver')->first();
        $platinum = Metal::where('name', 'Platinum')->first();

        if (!$gold || !$silver || !$platinum) {
            $this->command->error('Metals must be seeded before purities.');
            return;
        }

        $purities = [
            // Gold purities
            ['metal_id' => $gold->id, 'code' => '18K', 'name' => '18K', 'display_order' => 1],
            ['metal_id' => $gold->id, 'code' => '22K', 'name' => '22K', 'display_order' => 2],
            ['metal_id' => $gold->id, 'code' => '24K', 'name' => '24K', 'display_order' => 3],
            // Silver purities
            ['metal_id' => $silver->id, 'code' => '925', 'name' => '925', 'display_order' => 1],
            ['metal_id' => $silver->id, 'code' => '999', 'name' => '999', 'display_order' => 2],
            // Platinum purities
            ['metal_id' => $platinum->id, 'code' => '950', 'name' => '950', 'display_order' => 1],
        ];

        foreach ($purities as $purity) {
            MetalPurity::updateOrCreate(
                [
                    'metal_id' => $purity['metal_id'],
                    'name' => $purity['name'],
                ],
                [
                    'code' => $purity['code'],
                    'is_active' => true,
                    'display_order' => $purity['display_order'],
                ]
            );
        }

        $this->command->info('Imported ' . count($purities) . ' metal purities.');
    }
}


