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
            CatalogSeeder::class,
            DiamondDataSeeder::class,
            GeneralSettingsSeeder::class,
            MetalDataSeeder::class,
            OrderStatusSeeder::class,
            PaymentGatewaySeeder::class,
            PriceRateSeeder::class,
            SizeSeeder::class,
            StyleSeeder::class,
            UserAndKycSeeder::class,
            ProductSeeder::class,
        ]);
    }
}
