<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            BrandSeeder::class,
            CategorySeeder::class,
            ColorstoneDataSeeder::class,
            DiamondDataSeeder::class,
            MetalPuritySeeder::class,
            MetalSeeder::class,
            MetalToneSeeder::class,
            OrderStatusSeeder::class,
            PaymentGatewaySeeder::class,
            PriceRateSeeder::class,
            SizeSeeder::class,
            StyleSeeder::class,
            UserAndKycSeeder::class,

        ]);
    }
}
