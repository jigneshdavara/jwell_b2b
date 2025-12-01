<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Material;
use App\Models\User;
use App\Models\DiamondClarity;
use App\Models\DiamondColor;
use App\Models\DiamondCut;
use App\Models\DiamondShape;
use App\Models\DiamondType;
use App\Models\Metal;
use App\Models\MetalPurity;
use App\Models\MetalTone;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductVariantDiamond;
use App\Models\ProductVariantMetal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductVariantMetalsAndDiamondsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed required data
        $this->seed([
            \Database\Seeders\ReferenceDataSeeder::class,
            \Database\Seeders\MetalSeeder::class,
            \Database\Seeders\MetalPuritySeeder::class,
            \Database\Seeders\MetalToneSeeder::class,
        ]);

        // Create diamond catalog data
        $this->createDiamondCatalogData();
    }

    protected function createDiamondCatalogData(): void
    {
        DiamondType::create(['name' => 'Lab Grown', 'slug' => 'lab-grown', 'is_active' => true]);
        DiamondType::create(['name' => 'Natural', 'slug' => 'natural', 'is_active' => true]);

        DiamondShape::create(['name' => 'Round', 'slug' => 'round', 'is_active' => true]);
        DiamondShape::create(['name' => 'Oval', 'slug' => 'oval', 'is_active' => true]);

        DiamondColor::create(['name' => 'D', 'slug' => 'd', 'is_active' => true]);
        DiamondColor::create(['name' => 'E', 'slug' => 'e', 'is_active' => true]);

        DiamondClarity::create(['name' => 'FL', 'slug' => 'fl', 'is_active' => true]);
        DiamondClarity::create(['name' => 'VVS1', 'slug' => 'vvs1', 'is_active' => true]);

        DiamondCut::create(['name' => 'Excellent', 'slug' => 'excellent', 'is_active' => true]);
        DiamondCut::create(['name' => 'Very Good', 'slug' => 'very-good', 'is_active' => true]);
    }

    protected function createAdminUser(): User
    {
        return User::factory()->admin()->create([
            'email' => 'admin@test.com',
            'email_verified_at' => now(),
        ]);
    }

    public function test_can_create_product_with_variants_metals_and_diamonds(): void
    {
        $user = $this->createAdminUser();
        $brand = Brand::first();
        $category = Category::first();
        $material = Material::first() ?? Material::factory()->create();
        $gold = Metal::where('slug', 'gold')->first();
        $silver = Metal::where('slug', 'silver')->first();
        $gold18K = MetalPurity::where('metal_id', $gold->id)->where('label', '18K')->first();
        $silver925 = MetalPurity::where('metal_id', $silver->id)->where('label', '925')->first();
        $yellowGold = MetalTone::where('metal_id', $gold->id)->where('slug', 'yellow-gold')->first();
        $diamondType = DiamondType::first();
        $diamondShape = DiamondShape::first();
        $diamondColor = DiamondColor::first();
        $diamondClarity = DiamondClarity::first();
        $diamondCut = DiamondCut::first();

        $payload = [
            'sku' => 'TEST-PROD-001',
            'name' => 'Test Product',
            'description' => 'Test description',
            'brand_id' => $brand->id,
            'category_id' => $category->id,
            'material_id' => $material->id,
            'base_price' => 50000,
            'making_charge' => 5000,
            'is_variant_product' => true,
            'uses_diamond' => true,
            'metal_ids' => [$gold->id, $silver->id],
            'metal_purity_ids' => [$gold18K->id, $silver925->id],
            'metal_tone_ids' => [$yellowGold->id],
            'diamond_options' => [
                [
                    'key' => 'diamond-opt-1',
                    'type_id' => $diamondType->id,
                    'shape_id' => $diamondShape->id,
                    'color_id' => $diamondColor->id,
                    'clarity_id' => $diamondClarity->id,
                    'cut_id' => $diamondCut->id,
                    'weight' => 0.5,
                ],
            ],
            'variants' => [
                [
                    'sku' => 'VAR-001',
                    'label' => 'Gold 18K with Diamond',
                    'metal_id' => $gold->id,
                    'metal_purity_id' => $gold18K->id,
                    'price_adjustment' => 0,
                    'is_default' => true,
                    'metadata' => [
                        'diamond_option_key' => 'diamond-opt-1',
                        'diamond' => [
                            'key' => 'diamond-opt-1',
                            'type_id' => $diamondType->id,
                            'shape_id' => $diamondShape->id,
                            'color_id' => $diamondColor->id,
                            'clarity_id' => $diamondClarity->id,
                            'cut_id' => $diamondCut->id,
                            'weight' => 0.5,
                        ],
                    ],
                    'metals' => [],
                    'diamonds' => [],
                ],
                [
                    'sku' => 'VAR-002',
                    'label' => 'Silver 925',
                    'metal_id' => $silver->id,
                    'metal_purity_id' => $silver925->id,
                    'price_adjustment' => -5000,
                    'is_default' => false,
                    'metadata' => [],
                    'metals' => [],
                    'diamonds' => [],
                ],
            ],
        ];

        $response = $this->actingAs($user, 'admin')->post(route('admin.products.store'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('status', 'product_created');

        // Assert product was created
        $this->assertDatabaseHas('products', [
            'sku' => 'TEST-PROD-001',
            'name' => 'Test Product',
        ]);

        $product = Product::where('sku', 'TEST-PROD-001')->first();
        $this->assertNotNull($product);

        // Assert variants were created
        $this->assertDatabaseCount('product_variants', 2);
        $variant1 = ProductVariant::where('sku', 'VAR-001')->first();
        $variant2 = ProductVariant::where('sku', 'VAR-002')->first();
        $this->assertNotNull($variant1);
        $this->assertNotNull($variant2);

        // Assert variant metals were created
        $this->assertDatabaseCount('product_variant_metals', 2);
        $this->assertDatabaseHas('product_variant_metals', [
            'product_variant_id' => $variant1->id,
            'metal_id' => $gold->id,
            'metal_purity_id' => $gold18K->id,
        ]);
        $this->assertDatabaseHas('product_variant_metals', [
            'product_variant_id' => $variant2->id,
            'metal_id' => $silver->id,
            'metal_purity_id' => $silver925->id,
        ]);

        // Assert variant diamonds were created
        $this->assertDatabaseCount('product_variant_diamonds', 1);
        $this->assertDatabaseHas('product_variant_diamonds', [
            'product_variant_id' => $variant1->id,
            'diamond_type_id' => $diamondType->id,
            'diamond_shape_id' => $diamondShape->id,
            'diamond_color_id' => $diamondColor->id,
            'diamond_clarity_id' => $diamondClarity->id,
            'diamond_cut_id' => $diamondCut->id,
            'total_carat' => 0.5,
        ]);
    }

    public function test_can_update_product_variants_with_changed_metals_and_diamonds(): void
    {
        $user = $this->createAdminUser();
        $brand = Brand::first();
        $category = Category::first();
        $gold = Metal::where('slug', 'gold')->first();
        $silver = Metal::where('slug', 'silver')->first();
        $gold18K = MetalPurity::where('metal_id', $gold->id)->where('label', '18K')->first();
        $gold22K = MetalPurity::where('metal_id', $gold->id)->where('label', '22K')->first();
        $silver925 = MetalPurity::where('metal_id', $silver->id)->where('label', '925')->first();
        $diamondType = DiamondType::first();
        $diamondShape = DiamondShape::first();
        $diamondColor = DiamondColor::first();
        $diamondClarity = DiamondClarity::first();
        $diamondCut = DiamondCut::first();

        // Create product with initial variants
        $product = Product::factory()->create([
            'brand_id' => $brand->id,
            'category_id' => $category->id,
            'material_id' => $material->id,
            'is_variant_product' => true,
            'uses_diamond' => true,
            'metal_ids' => [$gold->id],
            'metal_purity_ids' => [$gold18K->id],
            'diamond_options' => [
                [
                    'key' => 'diamond-opt-1',
                    'type_id' => $diamondType->id,
                    'shape_id' => $diamondShape->id,
                    'color_id' => $diamondColor->id,
                    'clarity_id' => $diamondClarity->id,
                    'cut_id' => $diamondCut->id,
                    'weight' => 0.5,
                ],
            ],
        ]);

        $variant1 = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'VAR-001',
            'label' => 'Gold 18K',
            'is_default' => true,
        ]);

        $variantMetal1 = ProductVariantMetal::create([
            'product_variant_id' => $variant1->id,
            'metal_id' => $gold->id,
            'metal_purity_id' => $gold18K->id,
            'position' => 0,
        ]);

        $variantDiamond1 = ProductVariantDiamond::create([
            'product_variant_id' => $variant1->id,
            'diamond_type_id' => $diamondType->id,
            'diamond_shape_id' => $diamondShape->id,
            'diamond_color_id' => $diamondColor->id,
            'diamond_clarity_id' => $diamondClarity->id,
            'diamond_cut_id' => $diamondCut->id,
            'total_carat' => 0.5,
            'position' => 0,
        ]);

        // Update payload: change metal purity, add new variant, remove diamond from variant1
        $payload = [
            'sku' => $product->sku,
            'name' => $product->name,
            'description' => $product->description,
            'brand_id' => $product->brand_id,
            'category_id' => $product->category_id,
            'base_price' => $product->base_price,
            'making_charge' => $product->making_charge,
            'is_variant_product' => true,
            'uses_diamond' => true,
            'metal_ids' => [$gold->id, $silver->id],
            'metal_purity_ids' => [$gold22K->id, $silver925->id],
            'diamond_options' => $product->diamond_options,
            'variants' => [
                [
                    'id' => $variant1->id,
                    'sku' => 'VAR-001',
                    'label' => 'Gold 22K',
                    'metal_id' => $gold->id,
                    'metal_purity_id' => $gold22K->id, // Changed from 18K to 22K
                    'price_adjustment' => 0,
                    'is_default' => true,
                    'metadata' => [],
                    'metals' => [],
                    'diamonds' => [], // Removed diamond
                ],
                [
                    'sku' => 'VAR-002',
                    'label' => 'Silver 925',
                    'metal_id' => $silver->id,
                    'metal_purity_id' => $silver925->id,
                    'price_adjustment' => -5000,
                    'is_default' => false,
                    'metadata' => [],
                    'metals' => [],
                    'diamonds' => [],
                ],
            ],
        ];

        $response = $this->actingAs($user, 'admin')->put(route('admin.products.update', $product), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('status', 'product_updated');

        // Assert variant1 metal was updated
        $this->assertDatabaseHas('product_variant_metals', [
            'product_variant_id' => $variant1->id,
            'metal_id' => $gold->id,
            'metal_purity_id' => $gold22K->id, // Updated
        ]);

        // Assert variant1 diamond was removed
        $this->assertDatabaseMissing('product_variant_diamonds', [
            'product_variant_id' => $variant1->id,
        ]);

        // Assert new variant2 was created with metal
        $variant2 = ProductVariant::where('sku', 'VAR-002')->first();
        $this->assertNotNull($variant2);
        $this->assertDatabaseHas('product_variant_metals', [
            'product_variant_id' => $variant2->id,
            'metal_id' => $silver->id,
            'metal_purity_id' => $silver925->id,
        ]);

        // Assert old variant metal was deleted (replaced by new one)
        $this->assertDatabaseMissing('product_variant_metals', [
            'id' => $variantMetal1->id,
        ]);
    }

    public function test_can_create_product_with_metals_array_in_variants(): void
    {
        $user = $this->createAdminUser();
        $brand = Brand::first();
        $category = Category::first();
        $gold = Metal::where('slug', 'gold')->first();
        $silver = Metal::where('slug', 'silver')->first();
        $gold18K = MetalPurity::where('metal_id', $gold->id)->where('label', '18K')->first();
        $silver925 = MetalPurity::where('metal_id', $silver->id)->where('label', '925')->first();
        $yellowGold = MetalTone::where('metal_id', $gold->id)->where('slug', 'yellow-gold')->first();

        $payload = [
            'sku' => 'TEST-PROD-002',
            'name' => 'Test Product with Metals Array',
            'description' => 'Test description',
            'brand_id' => $brand->id,
            'category_id' => $category->id,
            'material_id' => $material->id,
            'base_price' => 50000,
            'making_charge' => 5000,
            'is_variant_product' => true,
            'uses_diamond' => false,
            'metal_ids' => [$gold->id, $silver->id],
            'metal_purity_ids' => [$gold18K->id, $silver925->id],
            'variants' => [
                [
                    'sku' => 'VAR-MULTI-001',
                    'label' => 'Gold + Silver Combo',
                    'price_adjustment' => 0,
                    'is_default' => true,
                    'metadata' => [],
                    // Using metals array instead of metal_id/metal_purity_id
                    'metals' => [
                        [
                            'metal_id' => $gold->id,
                            'metal_purity_id' => $gold18K->id,
                            'metal_tone_id' => $yellowGold->id,
                            'weight_grams' => 5.5,
                        ],
                        [
                            'metal_id' => $silver->id,
                            'metal_purity_id' => $silver925->id,
                            'weight_grams' => 2.3,
                        ],
                    ],
                    'diamonds' => [],
                ],
            ],
        ];

        $response = $this->actingAs($user, 'admin')->post(route('admin.products.store'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('status', 'product_created');

        $product = Product::where('sku', 'TEST-PROD-002')->first();
        $variant = ProductVariant::where('sku', 'VAR-MULTI-001')->first();

        // Assert both metals were created for the variant
        $this->assertDatabaseCount('product_variant_metals', 2);
        $this->assertDatabaseHas('product_variant_metals', [
            'product_variant_id' => $variant->id,
            'metal_id' => $gold->id,
            'metal_purity_id' => $gold18K->id,
            'metal_tone_id' => $yellowGold->id,
            'weight_grams' => 5.5,
            'position' => 0,
        ]);
        $this->assertDatabaseHas('product_variant_metals', [
            'product_variant_id' => $variant->id,
            'metal_id' => $silver->id,
            'metal_purity_id' => $silver925->id,
            'weight_grams' => 2.3,
            'position' => 1,
        ]);
    }

    public function test_can_create_product_with_diamonds_array_in_variants(): void
    {
        $user = $this->createAdminUser();
        $brand = Brand::first();
        $category = Category::first();
        $diamondType = DiamondType::first();
        $diamondShape = DiamondShape::first();
        $diamondColor = DiamondColor::first();
        $diamondClarity = DiamondClarity::first();
        $diamondCut = DiamondCut::first();

        $payload = [
            'sku' => 'TEST-PROD-003',
            'name' => 'Test Product with Diamonds Array',
            'description' => 'Test description',
            'brand_id' => $brand->id,
            'category_id' => $category->id,
            'material_id' => $material->id,
            'base_price' => 50000,
            'making_charge' => 5000,
            'is_variant_product' => true,
            'uses_diamond' => true,
            'diamond_options' => [
                [
                    'key' => 'diamond-opt-1',
                    'type_id' => $diamondType->id,
                    'shape_id' => $diamondShape->id,
                    'color_id' => $diamondColor->id,
                    'clarity_id' => $diamondClarity->id,
                    'cut_id' => $diamondCut->id,
                    'weight' => 0.5,
                ],
            ],
            'variants' => [
                [
                    'sku' => 'VAR-DIAMOND-001',
                    'label' => 'Multiple Diamonds',
                    'price_adjustment' => 0,
                    'is_default' => true,
                    'metadata' => [],
                    'metals' => [],
                    // Using diamonds array
                    'diamonds' => [
                        [
                            'diamond_type_id' => $diamondType->id,
                            'diamond_shape_id' => $diamondShape->id,
                            'diamond_color_id' => $diamondColor->id,
                            'diamond_clarity_id' => $diamondClarity->id,
                            'diamond_cut_id' => $diamondCut->id,
                            'total_carat' => 0.5,
                            'stone_count' => 1,
                        ],
                        [
                            'diamond_type_id' => $diamondType->id,
                            'diamond_shape_id' => DiamondShape::skip(1)->first()->id,
                            'diamond_color_id' => $diamondColor->id,
                            'diamond_clarity_id' => $diamondClarity->id,
                            'total_carat' => 0.3,
                            'stone_count' => 2,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($user, 'admin')->post(route('admin.products.store'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('status', 'product_created');

        $variant = ProductVariant::where('sku', 'VAR-DIAMOND-001')->first();

        // Assert both diamonds were created for the variant
        $this->assertDatabaseCount('product_variant_diamonds', 2);
        $this->assertDatabaseHas('product_variant_diamonds', [
            'product_variant_id' => $variant->id,
            'diamond_type_id' => $diamondType->id,
            'diamond_shape_id' => $diamondShape->id,
            'total_carat' => 0.5,
            'stone_count' => 1,
            'position' => 0,
        ]);
        $this->assertDatabaseHas('product_variant_diamonds', [
            'product_variant_id' => $variant->id,
            'diamond_type_id' => $diamondType->id,
            'total_carat' => 0.3,
            'stone_count' => 2,
            'position' => 1,
        ]);
    }

    public function test_updating_variant_removes_deleted_metals_and_diamonds(): void
    {
        $user = $this->createAdminUser();
        $brand = Brand::first();
        $category = Category::first();
        $gold = Metal::where('slug', 'gold')->first();
        $silver = Metal::where('slug', 'silver')->first();
        $gold18K = MetalPurity::where('metal_id', $gold->id)->where('label', '18K')->first();
        $diamondType = DiamondType::first();
        $diamondShape = DiamondShape::first();
        $diamondColor = DiamondColor::first();
        $diamondClarity = DiamondClarity::first();
        $diamondCut = DiamondCut::first();

        // Create product with variant that has multiple metals and diamonds
        $product = Product::factory()->create([
            'brand_id' => $brand->id,
            'category_id' => $category->id,
            'material_id' => $material->id,
            'is_variant_product' => true,
            'uses_diamond' => true,
        ]);

        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'VAR-001',
            'is_default' => true,
        ]);

        $metal1 = ProductVariantMetal::create([
            'product_variant_id' => $variant->id,
            'metal_id' => $gold->id,
            'metal_purity_id' => $gold18K->id,
            'position' => 0,
        ]);

        $metal2 = ProductVariantMetal::create([
            'product_variant_id' => $variant->id,
            'metal_id' => $silver->id,
            'metal_purity_id' => MetalPurity::where('metal_id', $silver->id)->first()->id,
            'position' => 1,
        ]);

        $diamond1 = ProductVariantDiamond::create([
            'product_variant_id' => $variant->id,
            'diamond_type_id' => $diamondType->id,
            'diamond_shape_id' => $diamondShape->id,
            'total_carat' => 0.5,
            'position' => 0,
        ]);

        $diamond2 = ProductVariantDiamond::create([
            'product_variant_id' => $variant->id,
            'diamond_type_id' => $diamondType->id,
            'total_carat' => 0.3,
            'position' => 1,
        ]);

        // Update: keep only metal1 and diamond1, remove metal2 and diamond2
        $payload = [
            'sku' => $product->sku,
            'name' => $product->name,
            'description' => $product->description,
            'brand_id' => $product->brand_id,
            'category_id' => $product->category_id,
            'base_price' => $product->base_price,
            'making_charge' => $product->making_charge,
            'is_variant_product' => true,
            'uses_diamond' => true,
            'variants' => [
                [
                    'id' => $variant->id,
                    'sku' => 'VAR-001',
                    'label' => $variant->label,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => true,
                    'metadata' => [],
                    'metals' => [
                        [
                            'id' => $metal1->id, // Keep this one
                            'metal_id' => $gold->id,
                            'metal_purity_id' => $gold18K->id,
                        ],
                        // metal2 is not included, so it should be deleted
                    ],
                    'diamonds' => [
                        [
                            'id' => $diamond1->id, // Keep this one
                            'diamond_type_id' => $diamondType->id,
                            'diamond_shape_id' => $diamondShape->id,
                            'total_carat' => 0.5,
                        ],
                        // diamond2 is not included, so it should be deleted
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($user, 'admin')->put(route('admin.products.update', $product), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('status', 'product_updated');

        // Assert metal1 still exists
        $this->assertDatabaseHas('product_variant_metals', [
            'id' => $metal1->id,
        ]);

        // Assert metal2 was deleted
        $this->assertDatabaseMissing('product_variant_metals', [
            'id' => $metal2->id,
        ]);

        // Assert diamond1 still exists
        $this->assertDatabaseHas('product_variant_diamonds', [
            'id' => $diamond1->id,
        ]);

        // Assert diamond2 was deleted
        $this->assertDatabaseMissing('product_variant_diamonds', [
            'id' => $diamond2->id,
        ]);

        // Assert only 1 metal and 1 diamond remain
        $this->assertDatabaseCount('product_variant_metals', 1);
        $this->assertDatabaseCount('product_variant_diamonds', 1);
    }
}
