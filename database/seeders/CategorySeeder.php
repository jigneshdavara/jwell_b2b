<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create parent categories first
        $parentCategories = [
            ['code' => 'RNG', 'name' => 'Rings', 'description' => 'Various types of rings including engagement, wedding, and fashion rings', 'display_order' => 1],
            ['code' => 'NKL', 'name' => 'Necklaces', 'description' => 'Necklaces and pendants in various styles and designs', 'display_order' => 2],
            ['code' => 'ERL', 'name' => 'Earrings', 'description' => 'Earrings including studs, hoops, and drop earrings', 'display_order' => 3],
            ['code' => 'BRC', 'name' => 'Bracelets', 'description' => 'Bracelets and bangles for all occasions', 'display_order' => 4],
            ['code' => 'CHN', 'name' => 'Chains', 'description' => 'Gold and silver chains in various designs', 'display_order' => 5],
            ['code' => 'PNT', 'name' => 'Pendants', 'description' => 'Pendants and lockets for necklaces', 'display_order' => 6],
        ];

        $createdParents = [];
        foreach ($parentCategories as $parent) {
            $category = Category::updateOrCreate(
                ['name' => $parent['name']],
                [
                    'code' => $parent['code'],
                    'description' => $parent['description'],
                    'is_active' => true,
                    'display_order' => $parent['display_order'],
                ]
            );
            $createdParents[$parent['name']] = $category;
        }

        // Create child categories
        $childCategories = [
            // Rings subcategories
            ['parent' => 'Rings', 'code' => 'ENG', 'name' => 'Engagement Rings', 'description' => 'Engagement rings with diamonds and gemstones', 'display_order' => 1],
            ['parent' => 'Rings', 'code' => 'WED', 'name' => 'Wedding Rings', 'description' => 'Wedding bands for couples', 'display_order' => 2],
            ['parent' => 'Rings', 'code' => 'FAS', 'name' => 'Fashion Rings', 'description' => 'Trendy and fashionable rings', 'display_order' => 3],
            ['parent' => 'Rings', 'code' => 'SOL', 'name' => 'Solitaire Rings', 'description' => 'Single stone rings', 'display_order' => 4],
            ['parent' => 'Rings', 'code' => 'CLS', 'name' => 'Cluster Rings', 'description' => 'Rings with multiple stones', 'display_order' => 5],

            // Necklaces subcategories
            ['parent' => 'Necklaces', 'code' => 'CHN', 'name' => 'Chain Necklaces', 'description' => 'Necklaces with chain designs', 'display_order' => 1],
            ['parent' => 'Necklaces', 'code' => 'PNT', 'name' => 'Pendant Necklaces', 'description' => 'Necklaces with pendant attachments', 'display_order' => 2],
            ['parent' => 'Necklaces', 'code' => 'CHK', 'name' => 'Choker Necklaces', 'description' => 'Short, close-fitting necklaces', 'display_order' => 3],
            ['parent' => 'Necklaces', 'code' => 'LNG', 'name' => 'Long Necklaces', 'description' => 'Extended length necklaces', 'display_order' => 4],

            // Earrings subcategories
            ['parent' => 'Earrings', 'code' => 'STD', 'name' => 'Stud Earrings', 'description' => 'Small, simple stud earrings', 'display_order' => 1],
            ['parent' => 'Earrings', 'code' => 'HOP', 'name' => 'Hoop Earrings', 'description' => 'Circular hoop earrings', 'display_order' => 2],
            ['parent' => 'Earrings', 'code' => 'DRP', 'name' => 'Drop Earrings', 'description' => 'Earrings that hang below the earlobe', 'display_order' => 3],
            ['parent' => 'Earrings', 'code' => 'JHM', 'name' => 'Jhumka Earrings', 'description' => 'Traditional Indian jhumka style', 'display_order' => 4],

            // Bracelets subcategories
            ['parent' => 'Bracelets', 'code' => 'BNG', 'name' => 'Bangles', 'description' => 'Rigid circular bracelets', 'display_order' => 1],
            ['parent' => 'Bracelets', 'code' => 'CHN', 'name' => 'Chain Bracelets', 'description' => 'Bracelets with chain links', 'display_order' => 2],
            ['parent' => 'Bracelets', 'code' => 'CHM', 'name' => 'Charm Bracelets', 'description' => 'Bracelets with decorative charms', 'display_order' => 3],
            ['parent' => 'Bracelets', 'code' => 'CTN', 'name' => 'Cuff Bracelets', 'description' => 'Open-ended bracelet designs', 'display_order' => 4],

            // Chains subcategories
            ['parent' => 'Chains', 'code' => 'CBL', 'name' => 'Cable Chains', 'description' => 'Classic cable link chains', 'display_order' => 1],
            ['parent' => 'Chains', 'code' => 'BOX', 'name' => 'Box Chains', 'description' => 'Square link box chains', 'display_order' => 2],
            ['parent' => 'Chains', 'code' => 'FIG', 'name' => 'Figaro Chains', 'description' => 'Italian figaro chain design', 'display_order' => 3],
            ['parent' => 'Chains', 'code' => 'RPE', 'name' => 'Rope Chains', 'description' => 'Twisted rope-style chains', 'display_order' => 4],

            // Pendants subcategories
            ['parent' => 'Pendants', 'code' => 'LKT', 'name' => 'Lockets', 'description' => 'Pendants that open to hold photos', 'display_order' => 1],
            ['parent' => 'Pendants', 'code' => 'CRS', 'name' => 'Cross Pendants', 'description' => 'Religious cross pendants', 'display_order' => 2],
            ['parent' => 'Pendants', 'code' => 'HRT', 'name' => 'Heart Pendants', 'description' => 'Heart-shaped pendant designs', 'display_order' => 3],
            ['parent' => 'Pendants', 'code' => 'GEM', 'name' => 'Gemstone Pendants', 'description' => 'Pendants with gemstone settings', 'display_order' => 4],
        ];

        foreach ($childCategories as $child) {
            $parentCategory = $createdParents[$child['parent']] ?? null;

            if ($parentCategory) {
                Category::updateOrCreate(
                    [
                        'parent_id' => $parentCategory->id,
                        'name' => $child['name'],
                    ],
                    [
                        'code' => $child['code'],
                        'description' => $child['description'],
                        'is_active' => true,
                        'display_order' => $child['display_order'],
                    ]
                );
            }
        }
    }
}
