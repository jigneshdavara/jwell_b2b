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
            ['name' => 'Gold', 'slug' => 'gold'],
            ['name' => 'Silver', 'slug' => 'silver'],
            ['name' => 'Platinum', 'slug' => 'platinum'],
        ];

        foreach ($metals as $metal) {
            Metal::updateOrCreate(
                ['slug' => $metal['slug']],
                [
                    'name' => $metal['name'],
                    'is_active' => true,
                    'position' => 0,
                ]
            );
        }
    }
}
