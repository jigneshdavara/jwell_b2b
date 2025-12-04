<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PaymentGatewaySeeder::class,
            ReferenceDataSeeder::class,
            UserAndKycSeeder::class,
            MetalSeeder::class,
            MetalPuritySeeder::class,
            MetalToneSeeder::class,
            OrderStatusSeeder::class,
            CommerceSeeder::class,
            ProductionSeeder::class,
            BrandSeeder::class,
            CatalogSeeder::class,
        ]);
    }
}
