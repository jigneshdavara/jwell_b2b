<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Material;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $dataset = require __DIR__.'/data/products.php';

        foreach ($dataset as $productData) {
            $brand = Brand::where('slug', $productData['brand_slug'])->first();
            $category = Category::where('slug', $productData['category_slug'])->first();
            $material = Material::where('name', $productData['material_name'])->first();

            if (! $brand || ! $category || ! $material) {
                continue;
            }

            $product = Product::updateOrCreate(
                ['sku' => $productData['sku']],
                [
                    'name' => $productData['name'],
                    'description' => $productData['description'],
                    'brand_id' => $brand->id,
                    'category_id' => $category->id,
                    'material_id' => $material->id,
                    'gross_weight' => $productData['gross_weight'],
                    'net_weight' => $productData['net_weight'],
                    'base_price' => $productData['base_price'],
                    'making_charge' => $productData['making_charge'],
                    'is_jobwork_allowed' => $productData['is_jobwork_allowed'],
                    'visibility' => 'public',
                    'metadata' => [
                        'stone_type' => $productData['stone_type'],
                        'purity' => $material->purity,
                    ],
                    'material_type' => $productData['material_type'],
                    'style' => $productData['style'],
                    'standard_pricing' => $productData['standard_pricing'],
                ]
            );

            $product->media()->delete();
            foreach ($productData['images'] as $index => $image) {
                ProductMedia::create([
                    'product_id' => $product->id,
                    'type' => 'image',
                    'url' => $image['url'],
                    'position' => $index,
                    'metadata' => ['alt' => $image['alt']],
                ]);
            }

            $product->variants()->delete();
            foreach ($productData['variants'] as $variant) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $variant['sku'] ?? null,
                    'label' => $variant['label'],
                    'metal_tone' => $variant['metal_tone'] ?? null,
                    'stone_quality' => $variant['stone_quality'] ?? null,
                    'size' => $variant['size'] ?? null,
                    'price_adjustment' => $variant['price_adjustment'] ?? 0,
                    'is_default' => $variant['is_default'] ?? false,
                    'metadata' => $variant['metadata'] ?? null,
                ]);
            }
        }
    }
}
