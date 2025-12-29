import { BaseSeeder } from './base-seeder';
import { Prisma } from '@prisma/client';

export class ProductSeeder extends BaseSeeder {
    async run(): Promise<void> {
        this.log('Seeding products with variants and catalog associations...');

        // Get reference data
        const brands = await this.prisma.brands.findMany({
            where: { is_active: true },
        });
        const categories = await this.prisma.categories.findMany({
            where: { is_active: true },
        });
        const catalogs = await this.prisma.catalogs.findMany({
            where: { is_active: true },
        });
        const styles = await this.prisma.styles.findMany({
            where: { is_active: true },
        });
        const sizes = await this.prisma.sizes.findMany({
            where: { is_active: true },
        });

        // Get metals and related data
        const gold = await this.prisma.metals.findFirst({
            where: { name: 'Gold' },
        });
        const silver = await this.prisma.metals.findFirst({
            where: { name: 'Silver' },
        });

        const goldPurities = gold
            ? await this.prisma.metal_purities.findMany({
                  where: { metal_id: gold.id },
              })
            : [];
        const silverPurities = silver
            ? await this.prisma.metal_purities.findMany({
                  where: { metal_id: silver.id },
              })
            : [];
        const goldTones = gold
            ? await this.prisma.metal_tones.findMany({
                  where: { metal_id: gold.id },
              })
            : [];
        const silverTones = silver
            ? await this.prisma.metal_tones.findMany({
                  where: { metal_id: silver.id },
              })
            : [];

        // Get diamond data
        const diamonds = await this.prisma.diamonds.findMany({
            where: { is_active: true },
            take: 10,
        });

        if (brands.length === 0 || categories.length === 0) {
            this.log(
                '⚠️  Brands and Categories must be seeded before products.',
            );
            return;
        }

        // Product definitions with realistic jewelry names
        const products = [
            {
                name: 'Classic Solitaire Engagement Ring',
                titleline: 'Timeless elegance for your special moment',
                description:
                    'A stunning solitaire engagement ring featuring a brilliant cut diamond set in premium gold. Perfect for proposing to your loved one.',
                category: 'Engagement Rings',
                catalogs: [
                    'Engagement Rings',
                    'Wedding Collection',
                    'Premium Collection',
                ],
                making_charge_amount: 5000,
                making_charge_percentage: 15,
                gender: 'Unisex',
                producttype: 'Ring',
                collection: 'Classic Collection',
            },
            {
                name: 'Rose Gold Wedding Band Set',
                titleline: 'Matching bands for the perfect couple',
                description:
                    'Elegant matching wedding bands in rose gold. Simple yet sophisticated design that symbolizes eternal love.',
                category: 'Wedding Rings',
                catalogs: [
                    'Wedding Collection',
                    'Bridal Collection',
                    'Anniversary Collection',
                ],
                making_charge_amount: 3000,
                making_charge_percentage: 12,
                gender: 'Unisex',
                producttype: 'Ring',
                collection: 'Wedding Collection',
            },
            {
                name: 'Diamond Stud Earrings',
                titleline: 'Sparkling elegance for everyday wear',
                description:
                    'Beautiful diamond stud earrings that add a touch of elegance to any outfit. Perfect for daily wear or special occasions.',
                category: 'Stud Earrings',
                catalogs: [
                    'Casual Collection',
                    'Gift Collection',
                    'Minimalist Collection',
                ],
                making_charge_amount: 2500,
                making_charge_percentage: 10,
                gender: 'Women',
                producttype: 'Earrings',
                collection: 'Everyday Collection',
            },
            {
                name: 'Traditional Gold Necklace Set',
                titleline: 'Heritage design with modern craftsmanship',
                description:
                    'Exquisite traditional gold necklace set with intricate designs. Perfect for weddings and festive occasions.',
                category: 'Chain Necklaces',
                catalogs: [
                    'Traditional Collection',
                    'Festive Collection',
                    'Wedding Collection',
                ],
                making_charge_amount: 8000,
                making_charge_percentage: 18,
                gender: 'Women',
                producttype: 'Necklace',
                collection: 'Traditional Collection',
            },
            {
                name: 'Vintage Pearl Drop Earrings',
                titleline: 'Timeless beauty with vintage charm',
                description:
                    'Elegant vintage-inspired pearl drop earrings that exude classic sophistication. Perfect for formal events.',
                category: 'Drop Earrings',
                catalogs: [
                    'Vintage Collection',
                    'Evening Wear',
                    'Formal Collection',
                ],
                making_charge_amount: 4000,
                making_charge_percentage: 14,
                gender: 'Women',
                producttype: 'Earrings',
                collection: 'Vintage Collection',
            },
            {
                name: 'Modern Tennis Bracelet',
                titleline: 'Contemporary elegance in motion',
                description:
                    'A stunning tennis bracelet featuring a continuous line of diamonds. Modern design that catches the light beautifully.',
                category: 'Chain Bracelets',
                catalogs: [
                    'Modern Collection',
                    'Premium Collection',
                    'Statement Collection',
                ],
                making_charge_amount: 12000,
                making_charge_percentage: 20,
                gender: 'Women',
                producttype: 'Bracelet',
                collection: 'Modern Collection',
            },
            {
                name: 'Heart Pendant with Chain',
                titleline: 'Express your love with elegance',
                description:
                    "A beautiful heart-shaped pendant on a delicate chain. Perfect gift for Valentine's Day or anniversaries.",
                category: 'Pendant Necklaces',
                catalogs: [
                    'Valentine Collection',
                    'Gift Collection',
                    'Romantic Collection',
                ],
                making_charge_amount: 2000,
                making_charge_percentage: 8,
                gender: 'Women',
                producttype: 'Pendant',
                collection: 'Romantic Collection',
            },
            {
                name: 'Traditional Gold Bangles Set',
                titleline: 'Cultural elegance for special occasions',
                description:
                    'A set of traditional gold bangles with intricate designs. Essential for Indian weddings and festivals.',
                category: 'Bangles',
                catalogs: [
                    'Traditional Collection',
                    'Festive Collection',
                    'Bridal Collection',
                ],
                making_charge_amount: 15000,
                making_charge_percentage: 22,
                gender: 'Women',
                producttype: 'Bangle',
                collection: 'Traditional Collection',
            },
            {
                name: 'Minimalist Gold Chain',
                titleline: 'Simple sophistication for everyday',
                description:
                    'A sleek and minimalist gold chain that complements any style. Perfect for layering or wearing alone.',
                category: 'Cable Chains',
                catalogs: [
                    'Minimalist Collection',
                    'Casual Collection',
                    'Modern Collection',
                ],
                making_charge_amount: 3500,
                making_charge_percentage: 12,
                gender: 'Unisex',
                producttype: 'Chain',
                collection: 'Minimalist Collection',
            },
            {
                name: 'Cluster Diamond Ring',
                titleline: 'Maximum sparkle in one design',
                description:
                    'A stunning cluster ring featuring multiple diamonds arranged in an elegant pattern. Eye-catching and luxurious.',
                category: 'Cluster Rings',
                catalogs: [
                    'Premium Collection',
                    'Statement Collection',
                    'Evening Wear',
                ],
                making_charge_amount: 6000,
                making_charge_percentage: 16,
                gender: 'Women',
                producttype: 'Ring',
                collection: 'Premium Collection',
            },
            {
                name: 'Silver Oxidized Jhumka Earrings',
                titleline: 'Traditional charm with contemporary style',
                description:
                    'Beautiful oxidized silver jhumka earrings with traditional Indian designs. Perfect for cultural events.',
                category: 'Jhumka Earrings',
                catalogs: [
                    'Traditional Collection',
                    'Ethnic Collection',
                    'Festive Collection',
                ],
                making_charge_amount: 1800,
                making_charge_percentage: 10,
                gender: 'Women',
                producttype: 'Earrings',
                collection: 'Traditional Collection',
            },
            {
                name: 'Platinum Eternity Band',
                titleline: 'Forever symbol of commitment',
                description:
                    'A classic platinum eternity band with diamonds all around. Timeless design that represents eternal love.',
                category: 'Wedding Rings',
                catalogs: [
                    'Wedding Collection',
                    'Premium Collection',
                    'Anniversary Collection',
                ],
                making_charge_amount: 10000,
                making_charge_percentage: 18,
                gender: 'Unisex',
                producttype: 'Ring',
                collection: 'Wedding Collection',
            },
        ];

        let createdCount = 0;

        for (const productData of products) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    // Find category - first try to find exact match, then try parent category
                    let category = categories.find(
                        (c) => c.name === productData.category,
                    );

                    // If not found, try to find a parent category that matches
                    if (!category) {
                        const parentCategoryName = this.getParentCategoryName(
                            productData.category,
                        );
                        if (parentCategoryName) {
                            const foundCategory = categories.find(
                                (c) =>
                                    c.name === parentCategoryName &&
                                    !c.parent_id,
                            );
                            if (foundCategory) {
                                category = foundCategory;
                            }
                        }
                    }

                    // If still not found, use first available parent category
                    if (!category) {
                        const parentCategory = categories.find(
                            (c) => !c.parent_id,
                        );
                        category = parentCategory || categories[0];
                    }

                    if (!category) {
                        throw new Error(
                            `No category found for product: ${productData.name}`,
                        );
                    }

                    // TypeScript guard: category is now guaranteed to be defined
                    const selectedCategory = category;

                    // Find subcategories (child categories) for the selected parent category
                    let subcategoryIds: bigint[] = [];
                    if (!selectedCategory.parent_id) {
                        // This is a parent category, find its children
                        const subcategories = categories.filter(
                            (c) => c.parent_id === selectedCategory.id,
                        );
                        if (subcategories.length > 0) {
                            // Select 1-2 random subcategories
                            const count = Math.min(2, subcategories.length);
                            const selectedSubcategories = subcategories
                                .sort(() => Math.random() - 0.5)
                                .slice(0, count);
                            subcategoryIds = selectedSubcategories.map(
                                (sc) => sc.id,
                            );
                        }
                    } else if (selectedCategory.parent_id) {
                        // This is already a subcategory, use it and its parent
                        subcategoryIds = [selectedCategory.id];
                        const parentCategory = categories.find(
                            (c) => c.id === selectedCategory.parent_id,
                        );
                        if (parentCategory) {
                            category = parentCategory;
                        }
                    }

                    // Use the final category (may have been updated if subcategory)
                    const finalCategory = category;

                    // Get styles from category via pivot table
                    const categoryStyleRelations =
                        await tx.category_styles.findMany({
                            where: { category_id: finalCategory.id },
                        });
                    const categoryStyleIds = categoryStyleRelations.map(
                        (r) => r.style_id,
                    );
                    const categoryStyles = styles.filter(
                        (s) =>
                            categoryStyleIds.includes(s.id) && s.is_active,
                    );
                    const styleIds: bigint[] = [];
                    if (categoryStyles.length > 0) {
                        // Select 1-3 styles from category
                        const count = Math.min(3, categoryStyles.length);
                        const selectedStyles = categoryStyles
                            .sort(() => Math.random() - 0.5)
                            .slice(0, count);
                        styleIds.push(...selectedStyles.map((s) => s.id));
                    }

                    // Get sizes from category via pivot table (for use in variants)
                    const categorySizeRelations =
                        await tx.category_sizes.findMany({
                            where: { category_id: finalCategory.id },
                        });
                    const categorySizeIds = categorySizeRelations.map(
                        (r) => r.size_id,
                    );
                    const categorySizes = sizes.filter(
                        (s) =>
                            categorySizeIds.includes(s.id) && s.is_active,
                    );

                    // Get random brand
                    const brand =
                        brands[Math.floor(Math.random() * brands.length)];

                    // Generate SKU
                    const skuBase = productData.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .substring(0, 8)
                        .toUpperCase();
                    const randomSuffix = Math.random()
                        .toString(36)
                        .substring(2, 6)
                        .toUpperCase();
                    const sku = `${skuBase}-${randomSuffix}`;

                    // Prepare product data
                    const productPayload = {
                        sku,
                        name: productData.name,
                        titleline: productData.titleline,
                        description: productData.description,
                        brand_id: brand.id,
                        category_id: finalCategory.id,
                        subcategory_ids:
                            subcategoryIds.length > 0
                                ? (subcategoryIds as unknown as Prisma.JsonArray)
                                : Prisma.JsonNull,
                        style_ids:
                            styleIds.length > 0
                                ? (styleIds as unknown as Prisma.JsonArray)
                                : Prisma.JsonNull,
                        collection: productData.collection,
                        producttype: productData.producttype,
                        gender: productData.gender,
                        making_charge_amount: productData.making_charge_amount,
                        making_charge_percentage:
                            productData.making_charge_percentage,
                        is_active: true,
                        metadata: {
                            making_charge_types: ['fixed', 'percentage'],
                        } as Prisma.JsonObject,
                    };

                    // Create or update product
                    const existingProduct = await tx.products.findUnique({
                        where: { sku },
                    });

                    let product;
                    if (existingProduct) {
                        product = await tx.products.update({
                            where: { id: existingProduct.id },
                            data: productPayload,
                        });
                    } else {
                        product = await tx.products.create({
                            data: productPayload,
                        });
                    }

                    // Associate with catalogs
                    if (
                        productData.catalogs &&
                        Array.isArray(productData.catalogs)
                    ) {
                        const catalogIds = catalogs
                            .filter((c) =>
                                productData.catalogs.includes(c.name),
                            )
                            .map((c) => c.id);

                        if (catalogIds.length > 0) {
                            // Delete existing catalog associations
                            await tx.catalog_products.deleteMany({
                                where: { product_id: product.id },
                            });

                            // Create new catalog associations
                            await tx.catalog_products.createMany({
                                data: catalogIds.map(
                                    (catalogId: bigint) => ({
                                        catalog_id: catalogId,
                                        product_id: product.id,
                                    }),
                                ),
                            });
                        }
                    }

                    // Create variants
                    const variants = this.buildVariantsForProduct(
                        product,
                        gold,
                        silver,
                        goldPurities,
                        silverPurities,
                        goldTones,
                        silverTones,
                        diamonds,
                        categorySizes,
                    );

                    // Delete existing variants and related data
                    const existingVariants = await tx.product_variants.findMany(
                        {
                            where: { product_id: product.id },
                            select: { id: true },
                        },
                    );
                    const existingVariantIds = existingVariants.map(
                        (v: { id: bigint }) => v.id,
                    );

                    if (existingVariantIds.length > 0) {
                        await tx.product_variant_metals.deleteMany({
                            where: {
                                product_variant_id: {
                                    in: existingVariantIds,
                                },
                            },
                        });
                        await tx.product_variant_diamonds.deleteMany({
                            where: {
                                product_variant_id: {
                                    in: existingVariantIds,
                                },
                            },
                        });
                    }
                    await tx.product_variants.deleteMany({
                        where: { product_id: product.id },
                    });

                    // Create variants with metals and diamonds
                    for (const variantData of variants) {
                        const variant = await tx.product_variants.create({
                            data: {
                                product_id: product.id,
                                sku: variantData.sku,
                                label: variantData.label,
                                size_id: variantData.size_id || null,
                                is_default: variantData.is_default,
                                inventory_quantity:
                                    variantData.inventory_quantity,
                                metadata:
                                    variantData.metadata as Prisma.JsonObject,
                            },
                        });

                        // Create variant metals
                        for (const metalData of variantData.metals) {
                            await tx.product_variant_metals.create({
                                data: {
                                    product_variant_id: variant.id,
                                    metal_id: metalData.metal_id,
                                    metal_purity_id:
                                        metalData.metal_purity_id || null,
                                    metal_tone_id:
                                        metalData.metal_tone_id || null,
                                    metal_weight:
                                        metalData.metal_weight || null,
                                    metadata:
                                        (metalData.metadata ||
                                            {}) as Prisma.JsonObject,
                                    display_order: 0,
                                },
                            });
                        }

                        // Create variant diamonds
                        for (const diamondData of variantData.diamonds) {
                            await tx.product_variant_diamonds.create({
                                data: {
                                    product_variant_id: variant.id,
                                    diamond_id:
                                        diamondData.diamond_id || null,
                                    diamonds_count:
                                        diamondData.diamonds_count || null,
                                    metadata:
                                        (diamondData.metadata ||
                                            {}) as Prisma.JsonObject,
                                    display_order: 0,
                                },
                            });
                        }
                    }

                    createdCount++;
                });
            } catch (error) {
                this.log(
                    `Failed to create product '${productData.name}': ${error instanceof Error ? error.message : String(error)}`,
                );
                continue;
            }
        }

        this.log(
            `Created ${createdCount} products with variants and catalog associations.`,
        );
    }

    /**
     * Build variants array in the format expected by ProductVariantSyncService
     * This matches the structure used in the admin product creation form
     */
    protected buildVariantsForProduct(
        product: { id: bigint; name: string; sku: string },
        gold: { id: bigint } | null,
        silver: { id: bigint } | null,
        goldPurities: Array<{ id: bigint; name: string }>,
        silverPurities: Array<{ id: bigint; name: string }>,
        goldTones: Array<{ id: bigint; name: string }>,
        silverTones: Array<{ id: bigint; name: string }>,
        diamonds: Array<{ id: bigint }>,
        categorySizes: Array<{
            id: bigint;
            name: string;
            code: string | null;
        }>,
    ): Array<{
        sku: string;
        label: string;
        size_id: bigint | null;
        is_default: boolean;
        inventory_quantity: number;
        metadata: Record<string, unknown>;
        metals: Array<{
            metal_id: bigint;
            metal_purity_id: bigint | null;
            metal_tone_id: bigint | null;
            metal_weight: number;
            metadata: Record<string, unknown>;
        }>;
        diamonds: Array<{
            diamond_id: bigint | null;
            diamonds_count: number | null;
            metadata: Record<string, unknown>;
        }>;
    }> {
        // Determine if product should use gold or silver based on name/type
        const productNameLower = product.name.toLowerCase();
        const useGold =
            !productNameLower.includes('silver') &&
            !productNameLower.includes('oxidized');
        const metal = useGold ? gold : silver;
        const purities = useGold ? goldPurities : silverPurities;
        const tones = useGold ? goldTones : silverTones;

        if (!metal || purities.length === 0 || tones.length === 0) {
            this.log(
                `Skipping variants for product ${product.name} - missing metal data.`,
            );
            return [];
        }

        // Create 2-4 variants per product
        const variantCount = Math.floor(Math.random() * 3) + 2; // 2-4
        const variants: Array<{
            sku: string;
            label: string;
            size_id: bigint | null;
            is_default: boolean;
            inventory_quantity: number;
            metadata: Record<string, unknown>;
            metals: Array<{
                metal_id: bigint;
                metal_purity_id: bigint | null;
                metal_tone_id: bigint | null;
                metal_weight: number;
                metadata: Record<string, unknown>;
            }>;
            diamonds: Array<{
                diamond_id: bigint | null;
                diamonds_count: number | null;
                metadata: Record<string, unknown>;
            }>;
        }> = [];

        for (let i = 0; i < variantCount; i++) {
            // Select random purity and tone
            const purity =
                purities[Math.floor(Math.random() * purities.length)];
            const tone = tones[Math.floor(Math.random() * tones.length)];

            // Select random size from category sizes (only if category has sizes available)
            let size: (typeof categorySizes)[0] | null = null;
            if (
                categorySizes.length > 0 &&
                Math.floor(Math.random() * 10) < 6
            ) {
                size =
                    categorySizes[
                        Math.floor(Math.random() * categorySizes.length)
                    ];
            }

            // Select random diamond (if applicable - 70% chance)
            let diamond: (typeof diamonds)[0] | null = null;
            if (diamonds.length > 0 && Math.floor(Math.random() * 10) < 7) {
                diamond =
                    diamonds[Math.floor(Math.random() * diamonds.length)];
            }

            // Generate variant SKU
            const variantSku = `${product.sku}-V${i + 1}`;

            // Generate variant label based on metal structure
            // Format matches admin interface: "{Purity} {Tone} {Metal}" or "{Purity} {Tone} {Metal} / {Size}"
            const metalLabelParts: string[] = [];

            // Build metal label: Purity + Tone + Metal Name (in that order)
            if (purity) {
                metalLabelParts.push(purity.name);
            }
            if (tone) {
                metalLabelParts.push(tone.name);
            }
            if (metal) {
                metalLabelParts.push(useGold ? 'Gold' : 'Silver');
            }

            // Metal label: "18K Yellow Gold"
            const metalLabel =
                metalLabelParts.length > 0
                    ? metalLabelParts.join(' ')
                    : '';

            // Final label: Metal + Size (if size exists)
            const labelParts = [metalLabel, size ? size.name : null].filter(
                Boolean,
            ) as string[];
            const label =
                labelParts.length > 0 ? labelParts.join(' / ') : 'Variant';

            // Build variant structure
            const variant = {
                sku: variantSku,
                label,
                size_id: size ? size.id : null,
                is_default: i === 0,
                inventory_quantity: Math.floor(Math.random() * 46) + 5, // 5-50
                metadata: {
                    size_cm: size
                        ? (size.code ? parseFloat(size.code) : 0)
                        : null,
                    size_value: size ? (size.code || size.name) : null,
                    size_unit: size ? 'cm' : null,
                },
                // Metals array
                metals: [
                    {
                        metal_id: metal.id,
                        metal_purity_id: purity ? purity.id : null,
                        metal_tone_id: tone ? tone.id : null,
                        metal_weight:
                            Math.round(
                                (Math.random() * 18 + 2 + Math.random()) * 100,
                            ) / 100, // Random weight between 2-20 grams
                        metadata: {},
                    },
                ],
                // Diamonds array - optional
                diamonds: diamond
                    ? [
                          {
                              diamond_id: diamond.id,
                              diamonds_count:
                                  Math.floor(Math.random() * 5) + 1, // 1-5
                              metadata: {},
                          },
                      ]
                    : [],
            };

            variants.push(variant);
        }

        return variants;
    }

    /**
     * Get parent category name based on subcategory name
     */
    protected getParentCategoryName(categoryName: string): string | null {
        const categoryMap: Record<string, string> = {
            'Engagement Rings': 'Rings',
            'Wedding Rings': 'Rings',
            'Fashion Rings': 'Rings',
            'Solitaire Rings': 'Rings',
            'Cluster Rings': 'Rings',
            'Chain Necklaces': 'Necklaces',
            'Pendant Necklaces': 'Necklaces',
            'Choker Necklaces': 'Necklaces',
            'Long Necklaces': 'Necklaces',
            'Stud Earrings': 'Earrings',
            'Hoop Earrings': 'Earrings',
            'Drop Earrings': 'Earrings',
            'Jhumka Earrings': 'Earrings',
            'Bangles': 'Bracelets',
            'Chain Bracelets': 'Bracelets',
            'Charm Bracelets': 'Bracelets',
            'Cuff Bracelets': 'Bracelets',
            'Cable Chains': 'Chains',
            'Box Chains': 'Chains',
            'Figaro Chains': 'Chains',
            'Rope Chains': 'Chains',
            'Lockets': 'Pendants',
            'Cross Pendants': 'Pendants',
            'Heart Pendants': 'Pendants',
            'Gemstone Pendants': 'Pendants',
        };

        return categoryMap[categoryName] || null;
    }
}
