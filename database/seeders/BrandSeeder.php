<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brands = [
            ['code' => 'TAN', 'name' => 'Tanishq', 'description' => 'Premium jewelry brand known for traditional and contemporary designs', 'display_order' => 1],
            ['code' => 'KAL', 'name' => 'Kalyan Jewellers', 'description' => 'Leading jewelry brand with extensive collection of gold and diamond jewelry', 'display_order' => 2],
            ['code' => 'JOS', 'name' => 'Jos Alukkas', 'description' => 'Renowned jewelry brand specializing in traditional and modern designs', 'display_order' => 3],
            ['code' => 'MAL', 'name' => 'Malabar Gold & Diamonds', 'description' => 'International jewelry brand offering gold, diamond, and platinum jewelry', 'display_order' => 4],
            ['code' => 'PCJ', 'name' => 'PC Jeweller', 'description' => 'Popular jewelry brand known for innovative designs and quality craftsmanship', 'display_order' => 5],
            ['code' => 'REL', 'name' => 'Reliance Jewels', 'description' => 'Trusted jewelry brand offering a wide range of traditional and contemporary jewelry', 'display_order' => 6],
            ['code' => 'CAR', 'name' => 'CaratLane', 'description' => 'Modern jewelry brand specializing in diamond and gold jewelry with contemporary designs', 'display_order' => 7],
            ['code' => 'BLU', 'name' => 'Bluestone', 'description' => 'Online jewelry brand offering designer jewelry in gold, diamonds, and gemstones', 'display_order' => 8],
            ['code' => 'GIA', 'name' => 'GIVA', 'description' => 'Luxury jewelry brand known for elegant and sophisticated designs', 'display_order' => 9],
            ['code' => 'ORR', 'name' => 'Orra', 'description' => 'Premium diamond jewelry brand with focus on modern and contemporary designs', 'display_order' => 10],
            ['code' => 'TIT', 'name' => 'Titan', 'description' => 'Well-known brand offering watches and jewelry with modern designs', 'display_order' => 11],
            ['code' => 'SEN', 'name' => 'Senco Gold', 'description' => 'Established jewelry brand offering traditional and modern gold jewelry', 'display_order' => 12],
            ['code' => 'THA', 'name' => 'Thangamayil', 'description' => 'Regional jewelry brand known for traditional designs and quality', 'display_order' => 13],
            ['code' => 'JUB', 'name' => 'Joyalukkas', 'description' => 'International jewelry brand with extensive collection of gold and diamond jewelry', 'display_order' => 14],
            ['code' => 'GRT', 'name' => 'GRT Jewellers', 'description' => 'Premium jewelry brand specializing in diamond and gold jewelry', 'display_order' => 15],
            ['code' => 'SUN', 'name' => 'Sunny Diamonds', 'description' => 'Diamond jewelry brand offering certified diamonds and modern designs', 'display_order' => 16],
            ['code' => 'DAM', 'name' => 'Damiani', 'description' => 'Italian luxury jewelry brand known for exquisite craftsmanship', 'display_order' => 17],
            ['code' => 'BUL', 'name' => 'Bulgari', 'description' => 'World-renowned luxury jewelry brand with iconic designs', 'display_order' => 18],
            ['code' => 'CART', 'name' => 'Cartier', 'description' => 'French luxury jewelry brand known for timeless elegance', 'display_order' => 19],
            ['code' => 'TIF', 'name' => 'Tiffany & Co.', 'description' => 'American luxury jewelry brand famous for diamond engagement rings', 'display_order' => 20],
        ];

        foreach ($brands as $brand) {
            Brand::updateOrCreate(
                ['name' => $brand['name']],
                [
                    'code' => $brand['code'],
                    'description' => $brand['description'],
                    'is_active' => true,
                    'display_order' => $brand['display_order'],
                ]
            );
        }
    }
}
