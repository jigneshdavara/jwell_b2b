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
            CatalogSeeder::class,
            CommerceSeeder::class,
            ProductionSeeder::class,
        ]);
    }
}
