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
            // Gold tones
            ['metal' => 'gold', 'name' => 'Yellow Gold', 'slug' => 'yellow-gold', 'position' => 1],
            ['metal' => 'gold', 'name' => 'White Gold', 'slug' => 'white-gold', 'position' => 2],
            ['metal' => 'gold', 'name' => 'Rose Gold', 'slug' => 'rose-gold', 'position' => 3],
            // Silver tones
            ['metal' => 'silver', 'name' => 'Silver', 'slug' => 'silver', 'position' => 1],
            ['metal' => 'silver', 'name' => 'Oxidized Silver', 'slug' => 'oxidized', 'position' => 2],
            // Platinum tones
            ['metal' => 'platinum', 'name' => 'Platinum', 'slug' => 'platinum', 'position' => 1],
        ];

        foreach ($tones as $tone) {
            $metal = Metal::where('slug', $tone['metal'])->first();

            if ($metal) {
                MetalTone::updateOrCreate(
                    [
                        'metal_id' => $metal->id,
                        'slug' => $tone['slug'],
                    ],
                    [
                        'name' => $tone['name'],
                        'is_active' => true,
                        'position' => $tone['position'],
                    ]
                );
            }
        }
    }
}
