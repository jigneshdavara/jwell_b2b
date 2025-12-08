<?php

namespace Database\Seeders;

use App\Models\Metal;
use Illuminate\Database\Seeder;

class MetalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $metals = [
            ['code' => 'AU', 'name' => 'Gold', 'display_order' => 1],
            ['code' => 'AG', 'name' => 'Silver', 'display_order' => 2],
            ['code' => 'PT', 'name' => 'Platinum', 'display_order' => 3],
        ];

        foreach ($metals as $metal) {
            Metal::updateOrCreate(
                ['name' => $metal['name']],
                [
                    'code' => $metal['code'],
                    'is_active' => true,
                    'display_order' => $metal['display_order'],
                ]
            );
        }
    }
}
