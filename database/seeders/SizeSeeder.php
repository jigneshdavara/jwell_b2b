<?php

namespace Database\Seeders;

use App\Models\Size;
use Illuminate\Database\Seeder;

class SizeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sizes = [
            ['code' => 'XS', 'name' => 'Extra Small', 'description' => 'Extra small size for petite jewelry', 'display_order' => 1],
            ['code' => 'S', 'name' => 'Small', 'description' => 'Small size for delicate jewelry', 'display_order' => 2],
            ['code' => 'M', 'name' => 'Medium', 'description' => 'Medium size - standard fit', 'display_order' => 3],
            ['code' => 'L', 'name' => 'Large', 'description' => 'Large size for bigger pieces', 'display_order' => 4],
            ['code' => 'XL', 'name' => 'Extra Large', 'description' => 'Extra large size for statement pieces', 'display_order' => 5],
            ['code' => '2', 'name' => 'Size 2', 'description' => 'Ring size 2', 'display_order' => 6],
            ['code' => '3', 'name' => 'Size 3', 'description' => 'Ring size 3', 'display_order' => 7],
            ['code' => '4', 'name' => 'Size 4', 'description' => 'Ring size 4', 'display_order' => 8],
            ['code' => '5', 'name' => 'Size 5', 'description' => 'Ring size 5', 'display_order' => 9],
            ['code' => '6', 'name' => 'Size 6', 'description' => 'Ring size 6', 'display_order' => 10],
            ['code' => '7', 'name' => 'Size 7', 'description' => 'Ring size 7', 'display_order' => 11],
            ['code' => '8', 'name' => 'Size 8', 'description' => 'Ring size 8', 'display_order' => 12],
            ['code' => '9', 'name' => 'Size 9', 'description' => 'Ring size 9', 'display_order' => 13],
            ['code' => '10', 'name' => 'Size 10', 'description' => 'Ring size 10', 'display_order' => 14],
            ['code' => '11', 'name' => 'Size 11', 'description' => 'Ring size 11', 'display_order' => 15],
            ['code' => '12', 'name' => 'Size 12', 'description' => 'Ring size 12', 'display_order' => 16],
            ['code' => '14', 'name' => 'Size 14', 'description' => 'Bangle size 14', 'display_order' => 17],
            ['code' => '16', 'name' => 'Size 16', 'description' => 'Bangle size 16', 'display_order' => 18],
            ['code' => '18', 'name' => 'Size 18', 'description' => 'Bangle size 18', 'display_order' => 19],
        ];

        foreach ($sizes as $size) {
            Size::updateOrCreate(
                ['name' => $size['name']],
                [
                    'code' => $size['code'],
                    'description' => $size['description'],
                    'is_active' => true,
                    'display_order' => $size['display_order'],
                ]
            );
        }
    }
}
