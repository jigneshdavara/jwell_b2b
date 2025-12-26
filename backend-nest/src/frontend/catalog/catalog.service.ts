import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../../common/pricing/pricing.service';
import { CatalogFilterDto } from './dto/catalog.dto';

@Injectable()
export class CatalogService {
    constructor(
        private prisma: PrismaService,
        private pricingService: PricingService,
    ) {}

    async findAll(filters: CatalogFilterDto, userId?: bigint) {
        const page = filters.page || 1;
        const perPage = 12;

        // Build where clause
        const where: any = {
            is_active: true,
        };

        // Filter by ready_made
        if (filters.ready_made === '1') {
            where.base_price = { not: null };
            where.AND = [...(where.AND || []), { base_price: { gt: 0 } }];
        }

        // Filter by brand
        if (filters.brand && filters.brand.length > 0) {
            const brandNames = filters.brand.filter((b) => b);
            if (brandNames.length > 0) {
                where.brands = {
                    name: { in: brandNames },
                };
            }
        }

        // Filter by metal
        if (filters.metal && filters.metal.length > 0) {
            const metalIds = filters.metal
                .filter((m) => m)
                .map((m) => BigInt(m));
            if (metalIds.length > 0) {
                where.product_variants = {
                    some: {
                        product_variant_metals: {
                            some: {
                                metal_id: { in: metalIds },
                            },
                        },
                    },
                };
            }
        }

        // Filter by metal_purity
        if (filters.metal_purity && filters.metal_purity.length > 0) {
            const purityIds = filters.metal_purity
                .filter((p) => p)
                .map((p) => BigInt(p));
            if (purityIds.length > 0) {
                // Combine with existing product_variants filter if present
                const existingVariantFilter = where.product_variants?.some;
                where.product_variants = {
                    some: {
                        ...(existingVariantFilter || {}),
                        product_variant_metals: {
                            some: {
                                metal_purity_id: { in: purityIds },
                            },
                        },
                    },
                };
            }
        }

        // Filter by metal_tone
        if (filters.metal_tone && filters.metal_tone.length > 0) {
            const toneIds = filters.metal_tone
                .filter((t) => t)
                .map((t) => BigInt(t));
            if (toneIds.length > 0) {
                // Combine with existing product_variants filter if present
                const existingVariantFilter = where.product_variants?.some;
                where.product_variants = {
                    some: {
                        ...(existingVariantFilter || {}),
                        product_variant_metals: {
                            some: {
                                metal_tone_id: { in: toneIds },
                            },
                        },
                    },
                };
            }
        }

        // Filter by diamond (format: "shape:1", "color:2", "clarity:3")
        if (filters.diamond && filters.diamond.length > 0) {
            const diamondFilters = filters.diamond.filter(
                (d) => d && d.includes(':'),
            );
            if (diamondFilters.length > 0) {
                const diamondConditions: any[] = [];
                for (const filter of diamondFilters) {
                    const [group, id] = filter.split(':');
                    const diamondId = parseInt(id);
                    if (diamondId > 0) {
                        switch (group) {
                            case 'shape':
                                diamondConditions.push({
                                    product_variant_diamonds: {
                                        some: {
                                            diamonds: {
                                                diamond_shape_id: diamondId,
                                            },
                                        },
                                    },
                                });
                                break;
                            case 'color':
                                diamondConditions.push({
                                    product_variant_diamonds: {
                                        some: {
                                            diamonds: {
                                                diamond_color_id: diamondId,
                                            },
                                        },
                                    },
                                });
                                break;
                            case 'clarity':
                                diamondConditions.push({
                                    product_variant_diamonds: {
                                        some: {
                                            diamonds: {
                                                diamond_clarity_id: diamondId,
                                            },
                                        },
                                    },
                                });
                                break;
                        }
                    }
                }
                if (diamondConditions.length > 0) {
                    where.OR = [...(where.OR || []), ...diamondConditions];
                }
            }
        }

        // Filter by category
        if (filters.category && filters.category.length > 0) {
            const categoryIds: bigint[] = [];
            const categoryNames: string[] = [];
            for (const cat of filters.category) {
                if (typeof cat === 'number' || /^\d+$/.test(String(cat))) {
                    categoryIds.push(BigInt(cat));
                } else {
                    categoryNames.push(String(cat));
                }
            }
            const categoryConditions: any[] = [];
            if (categoryIds.length > 0) {
                categoryConditions.push({ id: { in: categoryIds } });
            }
            if (categoryNames.length > 0) {
                categoryConditions.push({ name: { in: categoryNames } });
            }
            if (categoryConditions.length > 0) {
                where.categories = {
                    OR: categoryConditions,
                };
            }
        }

        // Filter by catalog
        if (filters.catalog && filters.catalog.length > 0) {
            const catalogIds: bigint[] = [];
            const catalogNames: string[] = [];
            for (const cat of filters.catalog) {
                if (typeof cat === 'number' || /^\d+$/.test(String(cat))) {
                    catalogIds.push(BigInt(cat));
                } else {
                    catalogNames.push(String(cat));
                }
            }
            const catalogConditions: any[] = [];
            if (catalogIds.length > 0) {
                catalogConditions.push({ id: { in: catalogIds } });
            }
            if (catalogNames.length > 0) {
                catalogConditions.push({ name: { in: catalogNames } });
            }
            if (catalogConditions.length > 0) {
                where.catalog_products = {
                    some: {
                        catalogs: {
                            OR: catalogConditions,
                        },
                    },
                };
            }
        }

        // Filter by search
        if (filters.search) {
            where.OR = [
                ...(where.OR || []),
                { name: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        // Order by
        let orderBy: any = { created_at: 'desc' };
        if (filters.sort === 'name_asc') {
            orderBy = { name: 'asc' };
        } else if (filters.sort === 'newest' || !filters.sort) {
            orderBy = { created_at: 'desc' };
        }
        // Note: price_asc and price_desc are handled after fetching products

        // Fetch products with relationships
        const products = await this.prisma.products.findMany({
            where,
            include: {
                categories: true,
                product_medias: {
                    orderBy: { display_order: 'asc' },
                },
                product_variants: {
                    orderBy: [{ is_default: 'desc' }, { id: 'asc' }],
                    include: {
                        product_variant_metals: {
                            include: {
                                metals: true,
                                metal_purities: true,
                                metal_tones: true,
                            },
                        },
                        product_variant_diamonds: {
                            include: {
                                diamonds: true,
                            },
                        },
                    },
                },
            },
            orderBy,
        });

        // Calculate prices for each product using PricingService
        const productsWithPrices = await Promise.all(
            products.map(async (product) => {
                // Get default variant or first variant
                const variant =
                    product.product_variants.find((v) => v.is_default) ||
                    product.product_variants[0] ||
                    null;

                let priceTotal = 0;
                const productAny = product as any;
                if (variant) {
                    const productForPricing = {
                        id: product.id,
                        making_charge_amount: productAny.making_charge_amount
                            ? parseFloat(
                                  productAny.making_charge_amount.toString(),
                              )
                            : null,
                        making_charge_percentage:
                            productAny.making_charge_percentage
                                ? parseFloat(
                                      productAny.making_charge_percentage.toString(),
                                  )
                                : null,
                        metadata: (productAny.metadata as any) || {},
                    };

                    const priceData =
                        await this.pricingService.calculateProductPrice(
                            productForPricing,
                            userId ? { id: userId } : null,
                            { variant_id: variant.id.toString() },
                        );
                    priceTotal = parseFloat(priceData.total?.toString() || '0');
                } else {
                    // No variant - calculate making charge only
                    const productForPricing = {
                        id: product.id,
                        making_charge_amount: productAny.making_charge_amount
                            ? parseFloat(
                                  productAny.making_charge_amount.toString(),
                              )
                            : null,
                        making_charge_percentage:
                            productAny.making_charge_percentage
                                ? parseFloat(
                                      productAny.making_charge_percentage.toString(),
                                  )
                                : null,
                        metadata: (productAny.metadata as any) || {},
                    };
                    const priceData =
                        await this.pricingService.calculateProductPrice(
                            productForPricing,
                            userId ? { id: userId } : null,
                            {},
                        );
                    priceTotal = parseFloat(priceData.total?.toString() || '0');
                }

                // Get thumbnail
                let thumbnail: string | null = null;
                const firstMedia = product.product_medias[0];
                if (firstMedia && firstMedia.url) {
                    if (
                        firstMedia.url.startsWith('http://') ||
                        firstMedia.url.startsWith('https://')
                    ) {
                        thumbnail = firstMedia.url;
                    } else if (firstMedia.url.startsWith('/storage/')) {
                        // URL already has /storage/ prefix, use as-is
                        thumbnail = firstMedia.url;
                    } else {
                        // URL is relative, add /storage/ prefix
                        thumbnail = `/storage/${firstMedia.url}`;
                    }
                }

                return {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    category: product.categories?.[0]?.name || null,
                    material: null, // Material relationship not found in Prisma schema
                    purity: (product.metadata as any)?.purity || null,
                    price_total: Math.max(0, priceTotal),
                    making_charge_amount: productAny.making_charge_amount
                        ? parseFloat(productAny.making_charge_amount.toString())
                        : 0,
                    thumbnail,
                    media: product.product_medias.map((media) => ({
                        url: media.url,
                        alt: (media.metadata as any)?.alt || product.name,
                    })),
                    uses_gold: productAny.uses_gold || false,
                    uses_silver: productAny.uses_silver || false,
                    uses_diamond: productAny.uses_diamond || false,
                    variants: product.product_variants.map((v) => ({
                        id: v.id,
                        label: v.label,
                        is_default: v.is_default,
                        metadata: (v.metadata as any) || {},
                    })),
                };
            }),
        );

        // Apply price filter
        let filteredProducts = productsWithPrices;
        if (
            filters.price_min !== undefined ||
            filters.price_max !== undefined
        ) {
            filteredProducts = productsWithPrices.filter((p) => {
                const price = p.price_total;
                if (
                    filters.price_min !== undefined &&
                    price < filters.price_min
                ) {
                    return false;
                }
                if (
                    filters.price_max !== undefined &&
                    price > filters.price_max
                ) {
                    return false;
                }
                return true;
            });
        }

        // Apply price sorting if needed
        if (filters.sort === 'price_asc') {
            filteredProducts.sort((a, b) => a.price_total - b.price_total);
        } else if (filters.sort === 'price_desc') {
            filteredProducts.sort((a, b) => b.price_total - a.price_total);
        }

        // Manual pagination
        const total = filteredProducts.length;
        const skip = (page - 1) * perPage;
        const items = filteredProducts.slice(skip, skip + perPage);

        // Get facets
        const facets = await this.getFacets();

        // Clean filters for response
        const cleanFilters = {
            brand: filters.brand?.filter((b) => b) || [],
            metal: filters.metal?.filter((m) => m) || [],
            metal_purity: filters.metal_purity?.filter((p) => p) || [],
            metal_tone: filters.metal_tone?.filter((t) => t) || [],
            diamond: filters.diamond?.filter((d) => d) || [],
            category: filters.category || [],
            catalog: filters.catalog || [],
            sort: filters.sort || null,
            ready_made: filters.ready_made === '1' ? '1' : null,
            search: filters.search || null,
            price_min: filters.price_min || null,
            price_max: filters.price_max || null,
        };

        return {
            filters: cleanFilters,
            products: {
                data: items,
                current_page: page,
                per_page: perPage,
                total,
                last_page: Math.ceil(total / perPage),
            },
            facets,
        };
    }

    async findOne(id: bigint, userId?: bigint) {
        const product = await this.prisma.products.findUnique({
            where: { id },
            include: {
                brands: true,
                categories: {
                    include: {
                        category_sizes: {
                            include: {
                                sizes: true,
                            },
                        },
                    },
                },
                product_medias: {
                    orderBy: { display_order: 'asc' },
                },
                product_variants: {
                    orderBy: [{ is_default: 'desc' }, { id: 'asc' }],
                    include: {
                        product_variant_metals: {
                            include: {
                                metals: true,
                                metal_purities: true,
                                metal_tones: true,
                            },
                        },
                        product_variant_diamonds: {
                            include: {
                                diamonds: {
                                    include: {
                                        diamond_shapes: true,
                                        diamond_colors: true,
                                        diamond_clarities: true,
                                    },
                                },
                            },
                        },
                        sizes: true,
                    },
                },
            },
        });

        if (!product) {
            throw new Error('Product not found');
        }

        // Build configuration options
        const configurationOptions = await this.buildConfigurationOptions(
            product,
            userId,
        );

        // Format product data
        const categorySizes =
            product.categories[0]?.category_sizes
                ?.filter((cs) => cs.sizes?.is_active)
                .map((cs) => ({
                    id: cs.sizes.id,
                    name: cs.sizes.name,
                    code: cs.sizes.code || cs.sizes.name,
                })) || [];

        return {
            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
                description: product.description,
                brand: product.brands?.name || null,
                material: null, // Material relationship not in schema
                purity: ((product as any).metadata as any)?.purity || null,
                base_price: (product as any).base_price
                    ? parseFloat((product as any).base_price.toString())
                    : 0,
                making_charge_amount: (product as any).making_charge_amount
                    ? parseFloat(
                          (product as any).making_charge_amount.toString(),
                      )
                    : 0,
                making_charge_percentage: (product as any)
                    .making_charge_percentage
                    ? parseFloat(
                          (product as any).making_charge_percentage.toString(),
                      )
                    : null,
                uses_gold: (product as any).uses_gold || false,
                uses_silver: (product as any).uses_silver || false,
                uses_diamond: (product as any).uses_diamond || false,
                category_sizes: categorySizes,
                media: product.product_medias.map((media) => ({
                    url: media.url,
                    alt: (media.metadata as any)?.alt || product.name,
                })),
                variants: product.product_variants.map((variant) => ({
                    id: variant.id,
                    label: variant.label,
                    is_default: variant.is_default,
                    metadata: (variant.metadata as any) || {},
                    metals: variant.product_variant_metals.map((vm) => ({
                        id: vm.id,
                        metal_id: vm.metal_id,
                        metal_purity_id: vm.metal_purity_id,
                        metal_tone_id: vm.metal_tone_id,
                        metal_weight: vm.metal_weight
                            ? parseFloat(vm.metal_weight.toString())
                            : null,
                        metal: vm.metals
                            ? {
                                  id: vm.metals.id,
                                  name: vm.metals.name,
                              }
                            : null,
                        metal_purity: vm.metal_purities
                            ? {
                                  id: vm.metal_purities.id,
                                  name: vm.metal_purities.name,
                              }
                            : null,
                        metal_tone: vm.metal_tones
                            ? {
                                  id: vm.metal_tones.id,
                                  name: vm.metal_tones.name,
                              }
                            : null,
                    })),
                    diamonds: variant.product_variant_diamonds.map((vd) => {
                        const diamond = vd.diamonds;
                        return {
                            id: vd.id,
                            diamond_id: vd.diamond_id,
                            diamonds_count: vd.diamonds_count || 0,
                            diamond: diamond
                                ? {
                                      id: diamond.id,
                                      name: diamond.name,
                                      diamond_clarity_id:
                                          diamond.diamond_clarity_id,
                                      diamond_color_id:
                                          diamond.diamond_color_id,
                                      diamond_shape_id:
                                          diamond.diamond_shape_id,
                                      diamond_clarity: diamond.diamond_clarities
                                          ? {
                                                id: diamond.diamond_clarities
                                                    .id,
                                                name: diamond.diamond_clarities
                                                    .name,
                                            }
                                          : null,
                                      diamond_color: diamond.diamond_colors
                                          ? {
                                                id: diamond.diamond_colors.id,
                                                name: diamond.diamond_colors
                                                    .name,
                                            }
                                          : null,
                                      diamond_shape: diamond.diamond_shapes
                                          ? {
                                                id: diamond.diamond_shapes.id,
                                                name: diamond.diamond_shapes
                                                    .name,
                                            }
                                          : null,
                                  }
                                : null,
                        };
                    }),
                })),
            },
            configurationOptions,
        };
    }

    async calculatePrice(productId: bigint, options: any, userId?: bigint) {
        const product = await this.prisma.products.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new Error('Product not found');
        }

        const productForPricing = {
            id: product.id,
            making_charge_amount: product.making_charge_amount
                ? parseFloat(product.making_charge_amount.toString())
                : null,
            making_charge_percentage: product.making_charge_percentage
                ? parseFloat(product.making_charge_percentage.toString())
                : null,
            metadata: (product.metadata as any) || {},
        };

        const priceData = await this.pricingService.calculateProductPrice(
            productForPricing,
            userId ? { id: userId } : null,
            options,
        );

        return priceData;
    }

    private async buildConfigurationOptions(product: any, userId?: bigint) {
        const configOptions: any[] = [];

        if (
            !product.product_variants ||
            product.product_variants.length === 0
        ) {
            return [];
        }

        for (const variant of product.product_variants) {
            // Build metals array
            const metals: any[] = [];
            const metalParts: string[] = [];

            for (const variantMetal of variant.product_variant_metals) {
                const metal = variantMetal.metals;
                const purity = variantMetal.metal_purities;
                const tone = variantMetal.metal_tones;

                if (metal && purity && tone) {
                    const weight = variantMetal.metal_weight
                        ? parseFloat(variantMetal.metal_weight.toString())
                        : null;
                    const weightStr = weight ? weight.toFixed(2) + 'g' : '';

                    const metalLabel =
                        `${purity.name} ${tone.name} ${metal.name} ${weightStr}`.trim();

                    metals.push({
                        label: metalLabel,
                        metalId: metal.id,
                        metalPurityId: purity.id,
                        metalToneId: tone.id,
                        metalWeight: weight ? weight.toFixed(2) : null,
                        purityName: purity.name,
                        toneName: tone.name,
                        metalName: metal.name,
                    });

                    metalParts.push(metalLabel);
                }
            }

            // Build diamonds array
            const diamonds: any[] = [];
            const diamondParts: string[] = [];

            for (const variantDiamond of variant.product_variant_diamonds) {
                const diamond = variantDiamond.diamonds;
                if (!diamond) continue;

                const parts: string[] = [];
                if (diamond.diamond_shapes) {
                    parts.push(diamond.diamond_shapes.name);
                }
                if (diamond.diamond_colors) {
                    parts.push(diamond.diamond_colors.name);
                }
                if (diamond.diamond_clarities) {
                    parts.push(diamond.diamond_clarities.name);
                }

                const countStr =
                    variantDiamond.diamonds_count > 1
                        ? `(${variantDiamond.diamonds_count})`
                        : '';
                const diamondLabel =
                    `${diamond.name || parts.join(' ')} ${countStr}`.trim();

                diamonds.push({
                    label: diamondLabel,
                    diamondShapeId: diamond.diamond_shape_id || 0,
                    diamondColorId: diamond.diamond_color_id || 0,
                    diamondClarityId: diamond.diamond_clarity_id || 0,
                    stoneCount: variantDiamond.diamonds_count || 0,
                    totalCarat: '0',
                });

                diamondParts.push(diamondLabel);
            }

            // Build combined labels
            const metalLabel = metalParts.join(' + ');
            const diamondLabel = diamondParts.join(' + ');
            const labelParts = [metalLabel, diamondLabel].filter((p) => p);
            const configLabel =
                labelParts.length > 0
                    ? labelParts.join(' | ')
                    : variant.label || `Configuration ${variant.id}`;

            // Calculate price using PricingService
            const productForPricing = {
                id: product.id,
                making_charge_amount: product.making_charge_amount
                    ? parseFloat(product.making_charge_amount.toString())
                    : null,
                making_charge_percentage: product.making_charge_percentage
                    ? parseFloat(product.making_charge_percentage.toString())
                    : null,
                metadata: (product.metadata as any) || {},
            };

            const priceData = await this.pricingService.calculateProductPrice(
                productForPricing,
                userId ? { id: userId } : null,
                { variant_id: variant.id.toString() },
            );

            const basePrice = product.base_price
                ? parseFloat(product.base_price.toString())
                : 0;

            configOptions.push({
                variant_id: variant.id,
                label: configLabel,
                metal_label: metalLabel,
                diamond_label: diamondLabel,
                metals,
                diamonds,
                size_id: variant.size_id,
                size: variant.sizes
                    ? {
                          id: variant.sizes.id,
                          name: variant.sizes.name,
                          value: variant.sizes.code || variant.sizes.name,
                      }
                    : null,
                price_total: parseFloat(priceData.total?.toString() || '0'),
                price_breakup: {
                    base: basePrice,
                    metal: parseFloat(priceData.metal?.toString() || '0'),
                    diamond: parseFloat(priceData.diamond?.toString() || '0'),
                    making: parseFloat(priceData.making?.toString() || '0'),
                },
                sku: variant.sku || product.sku,
                inventory_quantity: variant.inventory_quantity || 0,
                metadata: (variant.metadata as any) || {},
            });
        }

        // Ensure at least one option exists
        if (configOptions.length === 0 && product.product_variants.length > 0) {
            const firstVariant = product.product_variants[0];
            const productForPricing = {
                id: product.id,
                making_charge_amount: product.making_charge_amount
                    ? parseFloat(product.making_charge_amount.toString())
                    : null,
                making_charge_percentage: product.making_charge_percentage
                    ? parseFloat(product.making_charge_percentage.toString())
                    : null,
                metadata: (product.metadata as any) || {},
            };

            const priceData = await this.pricingService.calculateProductPrice(
                productForPricing,
                userId ? { id: userId } : null,
                {},
            );

            const basePrice = product.base_price
                ? parseFloat(product.base_price.toString())
                : 0;

            configOptions.push({
                variant_id: firstVariant.id,
                label: firstVariant.label || 'Default Configuration',
                metal_label: '',
                diamond_label: '',
                metals: [],
                diamonds: [],
                size_id: firstVariant.size_id,
                size: firstVariant.sizes
                    ? {
                          id: firstVariant.sizes.id,
                          name: firstVariant.sizes.name,
                          value:
                              firstVariant.sizes.code ||
                              firstVariant.sizes.name,
                      }
                    : null,
                price_total: parseFloat(priceData.total?.toString() || '0'),
                price_breakup: {
                    base: basePrice,
                    metal: 0,
                    diamond: 0,
                    making: parseFloat(priceData.making?.toString() || '0'),
                },
                sku: firstVariant.sku || (product as any).sku,
                inventory_quantity: firstVariant.inventory_quantity || 0,
                metadata: (firstVariant.metadata as any) || {},
            });
        }

        return configOptions;
    }

    private async getFacets() {
        const [
            categories,
            metals,
            metalPurities,
            metalTones,
            diamondShapes,
            diamondColors,
            diamondClarities,
            brands,
            catalogs,
        ] = await Promise.all([
            // Categories
            this.prisma.categories.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),

            // Metals
            this.prisma.metals.findMany({
                where: { is_active: true },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
                select: { id: true, name: true },
            }),

            // Metal Purities
            this.prisma.metal_purities.findMany({
                where: { is_active: true },
                include: {
                    metals: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),

            // Metal Tones
            this.prisma.metal_tones.findMany({
                where: { is_active: true },
                include: {
                    metals: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),

            // Diamond Shapes
            this.prisma.diamond_shapes.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),

            // Diamond Colors
            this.prisma.diamond_colors.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),

            // Diamond Clarities
            this.prisma.diamond_clarities.findMany({
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),

            // Brands
            this.prisma.brands.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
                select: { name: true },
            }),

            // Catalogs
            this.prisma.catalogs.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
                select: { id: true, name: true },
            }),
        ]);

        return {
            categories: categories.map((c) => ({
                id: c.id,
                name: c.name,
            })),
            metals: metals.map((m) => ({
                id: m.id,
                name: m.name,
            })),
            metalPurities: metalPurities.map((p) => ({
                id: p.id,
                name: p.name,
                metal_id: p.metal_id,
                metal: p.metals
                    ? { id: p.metals.id, name: p.metals.name }
                    : null,
            })),
            metalTones: metalTones.map((t) => ({
                id: t.id,
                name: t.name,
                metal_id: t.metal_id,
                metal: t.metals
                    ? { id: t.metals.id, name: t.metals.name }
                    : null,
            })),
            diamondOptions: {
                types: [], // DiamondType not in schema
                shapes: diamondShapes.map((s) => ({
                    id: s.id,
                    name: s.name,
                })),
                colors: diamondColors.map((c) => ({
                    id: c.id,
                    name: c.name,
                })),
                clarities: diamondClarities.map((c) => ({
                    id: c.id,
                    name: c.name,
                })),
            },
            brands: brands.map((b) => b.name),
            catalogs: catalogs.map((c) => ({
                id: c.id,
                name: c.name,
            })),
        };
    }
}
