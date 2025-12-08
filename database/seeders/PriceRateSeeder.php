<?php

namespace Database\Seeders;

use App\Models\PriceRate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PriceRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $rates = [
            // Gold rates (per gram in INR)
            ['metal' => 'gold', 'purity' => '24K', 'price_per_gram' => 13047.00, 'effective_at' => $now],
            ['metal' => 'gold', 'purity' => '22K', 'price_per_gram' => 11960.00, 'effective_at' => $now],
            ['metal' => 'gold', 'purity' => '18K', 'price_per_gram' => 9787.00, 'effective_at' => $now],

            // Silver rates (per gram in INR)
            ['metal' => 'silver', 'purity' => '999', 'price_per_gram' => 189.00, 'effective_at' => $now],
            ['metal' => 'silver', 'purity' => '925', 'price_per_gram' => 179.25, 'effective_at' => $now],

            // Platinum rates (per gram in INR)
            ['metal' => 'platinum', 'purity' => '950', 'price_per_gram' => 4798.00, 'effective_at' => $now],
        ];

        foreach ($rates as $rate) {
            $metal = strtolower($rate['metal']);
            $purity = $rate['purity'];

            // Find existing rate for this metal/purity combination
            $existingRate = PriceRate::where('metal', $metal)
                ->where('purity', $purity)
                ->orderBy('effective_at', 'desc')
                ->first();

            if ($existingRate) {
                // Update the most recent rate
                $existingRate->update([
                    'price_per_gram' => $rate['price_per_gram'],
                    'effective_at' => $now,
                    'source' => 'manual',
                    'metadata' => array_merge(
                        $existingRate->metadata ?? [],
                        [
                            'seeded' => true,
                            'seeded_at' => $now->toIso8601String(),
                        ]
                    ),
                ]);
            } else {
                // Create new rate
                PriceRate::create([
                    'metal' => $metal,
                    'purity' => $purity,
                    'price_per_gram' => $rate['price_per_gram'],
                    'currency' => 'INR',
                    'source' => 'manual',
                    'effective_at' => $now,
                    'metadata' => [
                        'seeded' => true,
                        'seeded_at' => $now->toIso8601String(),
                    ],
                ]);
            }
        }

        $this->command->info('Price rates seeded successfully!');
    }
}
