<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Catalog;
use App\Models\Category;
use App\Models\Diamond;
use App\Models\Metal;
use App\Models\MetalPurity;
use App\Models\MetalTone;
use App\Models\Product;
use App\Models\Size;
use App\Models\Style;
use App\Services\Catalog\ProductVariantSyncService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding products with variants and catalog associations...');

        // Get reference data
        $brands = Brand::where('is_active', true)->get();
        $categories = Category::where('is_active', true)->get();
        $catalogs = Catalog::where('is_active', true)->get();
        $styles = Style::where('is_active', true)->get();
        $sizes = Size::where('is_active', true)->get();

        // Get metals and related data
        $gold = Metal::where('name', 'Gold')->first();
        $silver = Metal::where('name', 'Silver')->first();
        $goldPurities = $gold ? MetalPurity::where('metal_id', $gold->id)->get() : collect();
        $silverPurities = $silver ? MetalPurity::where('metal_id', $silver->id)->get() : collect();
        $goldTones = $gold ? MetalTone::where('metal_id', $gold->id)->get() : collect();
        $silverTones = $silver ? MetalTone::where('metal_id', $silver->id)->get() : collect();

        // Get diamond data
        $diamonds = Diamond::where('is_active', true)->limit(10)->get();

        if ($brands->isEmpty() || $categories->isEmpty()) {
            $this->command->error('Brands and Categories must be seeded before products.');
            return;
        }

        // Product definitions with realistic jewelry names
        $products = [
            [
                'name' => 'Classic Solitaire Engagement Ring',
                'titleline' => 'Timeless elegance for your special moment',
                'description' => 'A stunning solitaire engagement ring featuring a brilliant cut diamond set in premium gold. Perfect for proposing to your loved one.',
                'category' => 'Engagement Rings',
                'catalogs' => ['Engagement Rings', 'Wedding Collection', 'Premium Collection'],
                'making_charge_amount' => 5000,
                'making_charge_percentage' => 15,
                'gender' => 'Unisex',
                'producttype' => 'Ring',
                'collection' => 'Classic Collection',
            ],
            [
                'name' => 'Rose Gold Wedding Band Set',
                'titleline' => 'Matching bands for the perfect couple',
                'description' => 'Elegant matching wedding bands in rose gold. Simple yet sophisticated design that symbolizes eternal love.',
                'category' => 'Wedding Rings',
                'catalogs' => ['Wedding Collection', 'Bridal Collection', 'Anniversary Collection'],
                'making_charge_amount' => 3000,
                'making_charge_percentage' => 12,
                'gender' => 'Unisex',
                'producttype' => 'Ring',
                'collection' => 'Wedding Collection',
            ],
            [
                'name' => 'Diamond Stud Earrings',
                'titleline' => 'Sparkling elegance for everyday wear',
                'description' => 'Beautiful diamond stud earrings that add a touch of elegance to any outfit. Perfect for daily wear or special occasions.',
                'category' => 'Stud Earrings',
                'catalogs' => ['Casual Collection', 'Gift Collection', 'Minimalist Collection'],
                'making_charge_amount' => 2500,
                'making_charge_percentage' => 10,
                'gender' => 'Women',
                'producttype' => 'Earrings',
                'collection' => 'Everyday Collection',
            ],
            [
                'name' => 'Traditional Gold Necklace Set',
                'titleline' => 'Heritage design with modern craftsmanship',
                'description' => 'Exquisite traditional gold necklace set with intricate designs. Perfect for weddings and festive occasions.',
                'category' => 'Chain Necklaces',
                'catalogs' => ['Traditional Collection', 'Festive Collection', 'Wedding Collection'],
                'making_charge_amount' => 8000,
                'making_charge_percentage' => 18,
                'gender' => 'Women',
                'producttype' => 'Necklace',
                'collection' => 'Traditional Collection',
            ],
            [
                'name' => 'Vintage Pearl Drop Earrings',
                'titleline' => 'Timeless beauty with vintage charm',
                'description' => 'Elegant vintage-inspired pearl drop earrings that exude classic sophistication. Perfect for formal events.',
                'category' => 'Drop Earrings',
                'catalogs' => ['Vintage Collection', 'Evening Wear', 'Formal Collection'],
                'making_charge_amount' => 4000,
                'making_charge_percentage' => 14,
                'gender' => 'Women',
                'producttype' => 'Earrings',
                'collection' => 'Vintage Collection',
            ],
            [
                'name' => 'Modern Tennis Bracelet',
                'titleline' => 'Contemporary elegance in motion',
                'description' => 'A stunning tennis bracelet featuring a continuous line of diamonds. Modern design that catches the light beautifully.',
                'category' => 'Chain Bracelets',
                'catalogs' => ['Modern Collection', 'Premium Collection', 'Statement Collection'],
                'making_charge_amount' => 12000,
                'making_charge_percentage' => 20,
                'gender' => 'Women',
                'producttype' => 'Bracelet',
                'collection' => 'Modern Collection',
            ],
            [
                'name' => 'Heart Pendant with Chain',
                'titleline' => 'Express your love with elegance',
                'description' => 'A beautiful heart-shaped pendant on a delicate chain. Perfect gift for Valentine\'s Day or anniversaries.',
                'category' => 'Pendant Necklaces',
                'catalogs' => ['Valentine Collection', 'Gift Collection', 'Romantic Collection'],
                'making_charge_amount' => 2000,
                'making_charge_percentage' => 8,
                'gender' => 'Women',
                'producttype' => 'Pendant',
                'collection' => 'Romantic Collection',
            ],
            [
                'name' => 'Traditional Gold Bangles Set',
                'titleline' => 'Cultural elegance for special occasions',
                'description' => 'A set of traditional gold bangles with intricate designs. Essential for Indian weddings and festivals.',
                'category' => 'Bangles',
                'catalogs' => ['Traditional Collection', 'Festive Collection', 'Bridal Collection'],
                'making_charge_amount' => 15000,
                'making_charge_percentage' => 22,
                'gender' => 'Women',
                'producttype' => 'Bangle',
                'collection' => 'Traditional Collection',
            ],
            [
                'name' => 'Minimalist Gold Chain',
                'titleline' => 'Simple sophistication for everyday',
                'description' => 'A sleek and minimalist gold chain that complements any style. Perfect for layering or wearing alone.',
                'category' => 'Cable Chains',
                'catalogs' => ['Minimalist Collection', 'Casual Collection', 'Modern Collection'],
                'making_charge_amount' => 3500,
                'making_charge_percentage' => 12,
                'gender' => 'Unisex',
                'producttype' => 'Chain',
                'collection' => 'Minimalist Collection',
            ],
            [
                'name' => 'Cluster Diamond Ring',
                'titleline' => 'Maximum sparkle in one design',
                'description' => 'A stunning cluster ring featuring multiple diamonds arranged in an elegant pattern. Eye-catching and luxurious.',
                'category' => 'Cluster Rings',
                'catalogs' => ['Premium Collection', 'Statement Collection', 'Evening Wear'],
                'making_charge_amount' => 6000,
                'making_charge_percentage' => 16,
                'gender' => 'Women',
                'producttype' => 'Ring',
                'collection' => 'Premium Collection',
            ],
            [
                'name' => 'Silver Oxidized Jhumka Earrings',
                'titleline' => 'Traditional charm with contemporary style',
                'description' => 'Beautiful oxidized silver jhumka earrings with traditional Indian designs. Perfect for cultural events.',
                'category' => 'Jhumka Earrings',
                'catalogs' => ['Traditional Collection', 'Ethnic Collection', 'Festive Collection'],
                'making_charge_amount' => 1800,
                'making_charge_percentage' => 10,
                'gender' => 'Women',
                'producttype' => 'Earrings',
                'collection' => 'Traditional Collection',
            ],
            [
                'name' => 'Platinum Eternity Band',
                'titleline' => 'Forever symbol of commitment',
                'description' => 'A classic platinum eternity band with diamonds all around. Timeless design that represents eternal love.',
                'category' => 'Wedding Rings',
                'catalogs' => ['Wedding Collection', 'Premium Collection', 'Anniversary Collection'],
                'making_charge_amount' => 10000,
                'making_charge_percentage' => 18,
                'gender' => 'Unisex',
                'producttype' => 'Ring',
                'collection' => 'Wedding Collection',
            ],
        ];

        $variantSync = app(ProductVariantSyncService::class);
        $createdCount = 0;

        foreach ($products as $productData) {
            try {
                DB::transaction(function () use (
                    $productData,
                    $brands,
                    $categories,
                    $catalogs,
                    $gold,
                    $silver,
                    $goldPurities,
                    $silverPurities,
                    $goldTones,
                    $silverTones,
                    $diamonds,
                    $variantSync,
                    &$createdCount
                ) {
                    // Find category - first try to find exact match, then try parent category
                    $category = $categories->firstWhere('name', $productData['category']);

                    // If not found, try to find a parent category that matches
                    if (!$category) {
                        // Try to find parent category (e.g., if looking for "Engagement Rings", find "Rings" parent)
                        $parentCategoryName = $this->getParentCategoryName($productData['category']);
                        if ($parentCategoryName) {
                            $category = $categories->where('name', $parentCategoryName)->whereNull('parent_id')->first();
                        }
                    }

                    // If still not found, use first available parent category
                    if (!$category) {
                        $category = $categories->whereNull('parent_id')->first() ?? $categories->first();
                    }

                    // Find subcategories (child categories) for the selected parent category
                    $subcategoryIds = [];
                    if ($category && $category->parent_id === null) {
                        // This is a parent category, find its children
                        $subcategories = $categories->where('parent_id', $category->id);
                        if ($subcategories->isNotEmpty()) {
                            // Select 1-2 random subcategories
                            $selectedSubcategories = $subcategories->random(min(2, $subcategories->count()));
                            $subcategoryIds = $selectedSubcategories->pluck('id')->toArray();
                        }
                    } elseif ($category && $category->parent_id !== null) {
                        // This is already a subcategory, use it and its parent
                        $subcategoryIds = [$category->id];
                        $category = $categories->find($category->parent_id) ?? $category;
                    }

                    // Load category with its styles and sizes relationships
                    $category->load([
                        'styles' => fn($query) => $query->where('is_active', true)->orderBy('display_order'),
                        'sizes' => fn($query) => $query->where('is_active', true)->orderBy('display_order')
                    ]);

                    // Get random brand
                    $brand = $brands->random();

                    // Get styles from category (not random - use category-specific styles)
                    $categoryStyles = $category->styles;
                    $styleIds = [];
                    if ($categoryStyles->isNotEmpty()) {
                        // Select 1-3 styles from category
                        $selectedStyles = $categoryStyles->random(min(3, $categoryStyles->count()));
                        $styleIds = $selectedStyles->pluck('id')->toArray();
                    }

                    // Get sizes from category (for use in variants)
                    $categorySizes = $category->sizes;

                    // Generate SKU
                    $sku = strtoupper(Str::substr(Str::slug($productData['name']), 0, 8)) . '-' . strtoupper(Str::random(4));

                    // Prepare product data
                    $productPayload = [
                        'sku' => $sku,
                        'name' => $productData['name'],
                        'titleline' => $productData['titleline'],
                        'description' => $productData['description'],
                        'brand_id' => $brand->id,
                        'category_id' => $category->id,
                        'subcategory_ids' => !empty($subcategoryIds) ? $subcategoryIds : null,
                        'style_ids' => !empty($styleIds) ? $styleIds : null,
                        'collection' => $productData['collection'],
                        'producttype' => $productData['producttype'],
                        'gender' => $productData['gender'],
                        'making_charge_amount' => $productData['making_charge_amount'],
                        'making_charge_percentage' => $productData['making_charge_percentage'],
                        'is_active' => true,
                        'metadata' => [
                            'making_charge_types' => ['fixed', 'percentage'],
                        ],
                    ];

                    // Create product
                    $product = Product::updateOrCreate(
                        ['sku' => $sku],
                        $productPayload
                    );

                    // Associate with catalogs
                    if (isset($productData['catalogs']) && is_array($productData['catalogs'])) {
                        $catalogIds = $catalogs->whereIn('name', $productData['catalogs'])->pluck('id')->toArray();
                        if (!empty($catalogIds)) {
                            $product->catalogs()->sync($catalogIds);
                        }
                    }

                    // Create variants using ProductVariantSyncService
                    // Pass category sizes instead of all sizes - only use if category has sizes
                    $variants = $this->buildVariantsForProduct(
                        $product,
                        $gold,
                        $silver,
                        $goldPurities,
                        $silverPurities,
                        $goldTones,
                        $silverTones,
                        $diamonds,
                        $categorySizes // Use category-specific sizes
                    );

                    // Sync variants using the service (same as admin product creation)
                    $variantSync->sync($product, $variants, null);

                    $createdCount++;
                });
            } catch (\Exception $e) {
                $this->command->error("Failed to create product '{$productData['name']}': " . $e->getMessage());
                continue;
            }
        }

        $this->command->info("Created {$createdCount} products with variants and catalog associations.");
    }

    /**
     * Build variants array in the format expected by ProductVariantSyncService
     * This matches the structure used in the admin product creation form
     */
    protected function buildVariantsForProduct(
        Product $product,
        ?Metal $gold,
        ?Metal $silver,
        $goldPurities,
        $silverPurities,
        $goldTones,
        $silverTones,
        $diamonds,
        $categorySizes
    ): array {
        // Determine if product should use gold or silver based on name/type
        $useGold = !Str::contains(strtolower($product->name), 'silver') && !Str::contains(strtolower($product->name), 'oxidized');
        $metal = $useGold ? $gold : $silver;
        $purities = $useGold ? $goldPurities : $silverPurities;
        $tones = $useGold ? $goldTones : $silverTones;

        if (!$metal || $purities->isEmpty() || $tones->isEmpty()) {
            $this->command->warn("Skipping variants for product {$product->name} - missing metal data.");
            return [];
        }

        // Create 2-4 variants per product
        $variantCount = rand(2, 4);
        $variants = [];

        for ($i = 0; $i < $variantCount; $i++) {
            // Select random purity and tone
            $purity = $purities->random();
            $tone = $tones->random();

            // Select random size from category sizes (only if category has sizes available)
            $size = null;
            if ($categorySizes && $categorySizes->isNotEmpty() && rand(1, 10) <= 6) {
                $size = $categorySizes->random();
            }

            // Select random diamond (if applicable - 70% chance)
            $diamond = null;
            if ($diamonds->isNotEmpty() && rand(1, 10) <= 7) {
                $diamond = $diamonds->random();
            }

            // Generate variant SKU
            $variantSku = $product->sku . '-V' . ($i + 1);

            // Generate variant label based on metal structure
            // Format matches admin interface: "{Purity} {Tone} {Metal}" or "{Purity} {Tone} {Metal} / {Size}"
            // Example: "18K Yellow Gold" or "22K Rose Gold / Size 6"
            $metalLabelParts = [];

            // Build metal label: Purity + Tone + Metal Name (in that order)
            if ($purity) {
                $metalLabelParts[] = $purity->name;
            }
            if ($tone) {
                $metalLabelParts[] = $tone->name;
            }
            if ($metal) {
                $metalLabelParts[] = $metal->name;
            }

            // Metal label: "18K Yellow Gold"
            $metalLabel = !empty($metalLabelParts) ? implode(' ', $metalLabelParts) : '';

            // Final label: Metal + Size (if size exists)
            $labelParts = array_filter([$metalLabel, $size ? $size->name : null]);
            $label = !empty($labelParts) ? implode(' / ', $labelParts) : 'Variant';

            // Build variant structure matching ProductVariantSyncService expectations
            $variant = [
                'sku' => $variantSku,
                'label' => $label,
                'size_id' => $size ? $size->id : null,
                'is_default' => $i === 0,
                'inventory_quantity' => rand(5, 50),
                'metadata' => [],
                // Metals array - required structure for ProductVariantSyncService
                'metals' => [
                    [
                        'metal_id' => $metal->id,
                        'metal_purity_id' => $purity->id,
                        'metal_tone_id' => $tone->id,
                        'metal_weight' => round(rand(2, 20) + (rand(0, 99) / 100), 2), // Random weight between 2-20 grams
                        'metadata' => [],
                    ],
                ],
                // Diamonds array - optional
                'diamonds' => $diamond ? [
                    [
                        'diamond_id' => $diamond->id,
                        'diamonds_count' => rand(1, 5),
                    ],
                ] : [],
            ];

            $variants[] = $variant;
        }

        return $variants;
    }

    /**
     * Get parent category name based on subcategory name
     */
    protected function getParentCategoryName(string $categoryName): ?string
    {
        $categoryMap = [
            'Engagement Rings' => 'Rings',
            'Wedding Rings' => 'Rings',
            'Fashion Rings' => 'Rings',
            'Solitaire Rings' => 'Rings',
            'Cluster Rings' => 'Rings',
            'Chain Necklaces' => 'Necklaces',
            'Pendant Necklaces' => 'Necklaces',
            'Choker Necklaces' => 'Necklaces',
            'Long Necklaces' => 'Necklaces',
            'Stud Earrings' => 'Earrings',
            'Hoop Earrings' => 'Earrings',
            'Drop Earrings' => 'Earrings',
            'Jhumka Earrings' => 'Earrings',
            'Bangles' => 'Bracelets',
            'Chain Bracelets' => 'Bracelets',
            'Charm Bracelets' => 'Bracelets',
            'Cuff Bracelets' => 'Bracelets',
            'Cable Chains' => 'Chains',
            'Box Chains' => 'Chains',
            'Figaro Chains' => 'Chains',
            'Rope Chains' => 'Chains',
            'Lockets' => 'Pendants',
            'Cross Pendants' => 'Pendants',
            'Heart Pendants' => 'Pendants',
            'Gemstone Pendants' => 'Pendants',
        ];

        return $categoryMap[$categoryName] ?? null;
    }
}
