<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Material;
use App\Models\MaterialType;
use App\Models\Offer;
use App\Models\PriceRate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'Aarohi Heritage', 'slug' => 'aarohi-heritage'],
            ['name' => 'Rajwada Jewels', 'slug' => 'rajwada-jewels'],
            ['name' => 'Kalyan Craft Studio', 'slug' => 'kalyan-craft-studio'],
            ['name' => 'Jaipur Meenakari Atelier', 'slug' => 'jaipur-meenakari-atelier'],
            ['name' => 'TempleCraft Legacy', 'slug' => 'templecraft-legacy'],
            ['name' => 'Navratna Collective', 'slug' => 'navratna-collective'],
            ['name' => 'Heritage Men Atelier', 'slug' => 'heritage-men'],
        ];

        foreach ($brands as $brand) {
            Brand::updateOrCreate(['slug' => $brand['slug']], $brand + [
                'description' => 'Handcrafted Indian fine jewellery label.',
            ]);
        }

        $categories = [
            'bridal-hastkala' => 'Bridal Hastkala Sets',
            'temple-gold' => 'Temple Gold Classics',
            'meenakari-artistry' => 'Meenakari Artistry',
            'polki-regalia' => 'Polki Regalia',
            'kundan-bengals' => 'Kundan Bangles & Kada',
            'heritage-men' => "Heritage Men's Collection",
            'daily-minimal' => 'Everyday Minimal Gold',
            'navratna-signature' => 'Navratna Signature Pieces',
        ];

        foreach ($categories as $slug => $name) {
            Category::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'description' => 'Curated assortment inspired by Indian heritage aesthetics.',
                    'is_active' => true,
                ]
            );
        }

        $materials = [
            ['name' => '22K Yellow Gold', 'type' => 'gold', 'purity' => '22K', 'unit' => 'g'],
            ['name' => '18K Rose Gold', 'type' => 'gold', 'purity' => '18K', 'unit' => 'g'],
            ['name' => '18K White Gold', 'type' => 'gold', 'purity' => '18K', 'unit' => 'g'],
            ['name' => 'Platinum 950', 'type' => 'platinum', 'purity' => '950', 'unit' => 'g'],
            ['name' => 'Sterling Silver', 'type' => 'silver', 'purity' => '92.5', 'unit' => 'g'],
        ];

        $materialTypeLookup = collect($materials)
            ->pluck('type')
            ->unique()
            ->mapWithKeys(function (string $typeKey) {
                $name = Str::headline($typeKey);

                $materialType = MaterialType::updateOrCreate(
                    ['slug' => Str::slug($typeKey)],
                    [
                        'name' => $name,
                        'description' => null,
                        'is_active' => true,
                    ]
                );

                return [$typeKey => $materialType->id];
            });

        foreach ($materials as $material) {
            $typeName = Str::headline($material['type']);
            $materialTypeId = $materialTypeLookup[$material['type']] ?? null;

            Material::updateOrCreate(
                ['name' => $material['name']],
                [
                    'type' => $typeName,
                    'material_type_id' => $materialTypeId,
                    'purity' => $material['purity'],
                    'unit' => $material['unit'],
                    'is_active' => true,
                ]
            );
        }

        PriceRate::truncate();
        PriceRate::insert([
            [
                'metal' => 'GOLD',
                'purity' => '24K',
                'price_per_gram' => 7410.00,
                'currency' => 'INR',
                'source' => 'IBJA Snapshot',
                'effective_at' => now()->subMinutes(15),
            ],
            [
                'metal' => 'GOLD',
                'purity' => '22K',
                'price_per_gram' => 6775.00,
                'currency' => 'INR',
                'source' => 'IBJA Snapshot',
                'effective_at' => now()->subMinutes(15),
            ],
            [
                'metal' => 'SILVER',
                'purity' => '999',
                'price_per_gram' => 88.40,
                'currency' => 'INR',
                'source' => 'MCX Reference',
                'effective_at' => now()->subMinutes(10),
            ],
        ]);

        Offer::truncate();
        Offer::insert([
            [
                'code' => 'WELCOME5',
                'name' => 'Welcome Bonus',
                'description' => '5% making charge waiver on first order',
                'type' => 'percentage',
                'value' => 5,
                'starts_at' => now()->subDays(7),
                'ends_at' => now()->addMonths(2),
                'is_active' => true,
            ],
            [
                'code' => 'FESTIVE22',
                'name' => 'Festive Gold Event',
                'description' => 'Flat ₹2,500 off per lakh on Polki Regalia line items',
                'type' => 'flat',
                'value' => 2500,
                'starts_at' => now()->subDays(3),
                'ends_at' => now()->addDays(20),
                'is_active' => true,
            ],
        ]);
    }
}
