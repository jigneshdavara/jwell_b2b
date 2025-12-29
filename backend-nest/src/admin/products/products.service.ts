import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateProductDto,
    UpdateProductDto,
    ProductDetailResponseDto,
} from './dto/product.dto';
import { Prisma } from '@prisma/client';

// Type for product with all relations included
type ProductWithRelations = Prisma.productsGetPayload<{
    include: {
        product_medias: true;
        catalog_products: {
            include: {
                catalogs: true;
            };
        };
        product_variants: {
            include: {
                product_variant_metals: {
                    include: {
                        metals: true;
                        metal_purities: true;
                        metal_tones: true;
                    };
                };
                product_variant_diamonds: {
                    include: {
                        diamonds: true;
                    };
                };
            };
        };
    };
}>;

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

    async getOptions() {
        const [
            brands,
            categories,
            sizes,
            metals,
            metalPurities,
            metalTones,
            diamonds,
        ] = await Promise.all([
            this.prisma.brands.findMany({
                where: { is_active: true },
                select: { id: true, name: true, code: true },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.categories.findMany({
                where: { is_active: true },
                select: { id: true, name: true, code: true, parent_id: true },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.sizes.findMany({
                where: { is_active: true },
                select: { id: true, name: true, code: true },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.metals.findMany({
                where: { is_active: true },
                select: { id: true, name: true, code: true },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.metal_purities.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    metal_id: true,
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.metal_tones.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    metal_id: true,
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamonds.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    diamond_type_id: true,
                    diamond_clarity_id: true,
                    diamond_color_id: true,
                    diamond_shape_id: true,
                },
                orderBy: { name: 'asc' },
            }),
        ]);

        return {
            brands: brands.map((b) => ({
                id: Number(b.id),
                name: b.name,
                code: b.code,
            })),
            categories: categories.map((c) => ({
                id: Number(c.id),
                name: c.name,
                code: c.code,
                parent_id: c.parent_id ? Number(c.parent_id) : null,
            })),
            sizes: sizes.map((s) => ({
                id: Number(s.id),
                name: s.name,
                code: s.code,
            })),
            metals: metals.map((m) => ({
                id: Number(m.id),
                name: m.name,
                code: m.code,
            })),
            metal_purities: metalPurities.map((mp) => ({
                id: Number(mp.id),
                name: mp.name,
                code: mp.code,
                metal_id: Number(mp.metal_id),
            })),
            metal_tones: metalTones.map((mt) => ({
                id: Number(mt.id),
                name: mt.name,
                code: mt.code,
                metal_id: Number(mt.metal_id),
            })),
            diamonds: diamonds.map((d) => ({
                id: Number(d.id),
                name: d.name,
                price: d.price ? Number(d.price) : null,
                diamond_type_id: d.diamond_type_id
                    ? Number(d.diamond_type_id)
                    : null,
                diamond_clarity_id: d.diamond_clarity_id
                    ? Number(d.diamond_clarity_id)
                    : null,
                diamond_color_id: d.diamond_color_id
                    ? Number(d.diamond_color_id)
                    : null,
                diamond_shape_id: d.diamond_shape_id
                    ? Number(d.diamond_shape_id)
                    : null,
            })),
        };
    }

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.products.findMany({
                skip,
                take: perPage,
                include: {
                    brands: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    categories: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    product_medias: {
                        orderBy: { display_order: 'asc' },
                    },
                    catalog_products: {
                        include: {
                            catalogs: true,
                        },
                    },
                    product_variants: {
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
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.products.count(),
        ]);

        return {
            items: items.map((item) => this.formatProductResponse(item)),
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number): Promise<ProductDetailResponseDto> {
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(id) },
            include: {
                product_medias: {
                    orderBy: { display_order: 'asc' },
                },
                catalog_products: {
                    include: {
                        catalogs: true,
                    },
                },
                product_variants: {
                    include: {
                        product_variant_metals: {
                            include: {
                                metals: true,
                                metal_purities: true,
                                metal_tones: true,
                            },
                            orderBy: { display_order: 'asc' },
                        },
                        product_variant_diamonds: {
                            include: {
                                diamonds: true,
                            },
                            orderBy: { display_order: 'asc' },
                        },
                    },
                },
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return this.formatProductResponse(product);
    }

    async create(dto: CreateProductDto, mediaFiles: string[] = []) {
        // Validate variants have at least one metal (required)
        if (dto.variants && dto.variants.length > 0) {
            for (const variant of dto.variants) {
                if (!variant.metals || variant.metals.length === 0) {
                    throw new ConflictException(
                        `Variant "${variant.label || variant.sku || 'Unknown'}" must have at least one metal. Metals are required for all variants.`,
                    );
                }
            }
        }

        // Use transaction to ensure atomicity
        return await this.prisma.$transaction(async (tx) => {
            // Check if SKU already exists
            const existingBySku = await tx.products.findUnique({
                where: { sku: dto.sku },
            });

            if (existingBySku) {
                throw new ConflictException(
                    'Product with this SKU already exists',
                );
            }

            // Validate brand and category exist
            const [brand, category] = await Promise.all([
                tx.brands.findUnique({
                    where: { id: BigInt(dto.brand_id) },
                }),
                tx.categories.findUnique({
                    where: { id: BigInt(dto.category_id) },
                }),
            ]);

            if (!brand) {
                throw new NotFoundException('Brand not found');
            }

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            // Create product with nested relations
            // Note: product_medias, product_variants, product_variant_metals, and product_variant_diamonds
            // are stored in separate tables with foreign keys to products/product_variants
            // Prisma's nested create automatically creates records in these related tables
            const product = await tx.products.create({
                data: {
                    // Product table fields
                    name: dto.name,
                    sku: dto.sku,
                    titleline: dto.titleline,
                    brand_id: BigInt(dto.brand_id),
                    category_id: BigInt(dto.category_id),
                    subcategory_ids: dto.subcategory_ids || [],
                    style_ids:
                        dto.style_ids && dto.style_ids.length > 0
                            ? (dto.style_ids as Prisma.InputJsonValue)
                            : Prisma.JsonNull,
                    description: dto.description,
                    collection: dto.collection,
                    producttype: dto.producttype,
                    gender: dto.gender,
                    making_charge_amount: dto.making_charge_amount
                        ? dto.making_charge_amount
                        : null,
                    making_charge_percentage: dto.making_charge_percentage
                        ? dto.making_charge_percentage
                        : null,
                    is_active: dto.is_active ?? true,
                    metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
                    // Connect catalogs (many-to-many relationship)
                    catalog_products:
                        dto.catalog_ids && dto.catalog_ids.length > 0
                            ? {
                                  create: dto.catalog_ids.map((catalogId) => ({
                                      catalog_id: BigInt(catalogId),
                                  })),
                              }
                            : undefined,
                    // Create records in product_medias table (separate table)
                    // Merge uploaded files with DTO media
                    product_medias: this.buildMediaData(dto.media, mediaFiles),
                    // Create records in product_variants table (separate table)
                    product_variants: dto.variants
                        ? {
                              create: dto.variants.map((variant) => ({
                                  sku: variant.sku,
                                  label: variant.label,
                                  size_id: variant.size_id
                                      ? BigInt(variant.size_id)
                                      : null,
                                  inventory_quantity:
                                      variant.inventory_quantity,
                                  is_default: variant.is_default ?? false,
                                  metadata: (variant.metadata ||
                                      {}) as Prisma.InputJsonValue,
                                  // Create records in product_variant_metals table (separate table)
                                  product_variant_metals: variant.metals
                                      ? {
                                            create: variant.metals.map(
                                                (metal, metalIndex) => ({
                                                    metal_id: BigInt(
                                                        metal.metal_id,
                                                    ),
                                                    metal_purity_id:
                                                        metal.metal_purity_id
                                                            ? BigInt(
                                                                  metal.metal_purity_id,
                                                              )
                                                            : null,
                                                    metal_tone_id:
                                                        metal.metal_tone_id
                                                            ? BigInt(
                                                                  metal.metal_tone_id,
                                                              )
                                                            : null,
                                                    metal_weight:
                                                        metal.metal_weight,
                                                    metadata: (metal.metadata ||
                                                        {}) as Prisma.InputJsonValue,
                                                    display_order: metalIndex,
                                                }),
                                            ),
                                        }
                                      : undefined,
                                  // Create records in product_variant_diamonds table (separate table)
                                  product_variant_diamonds: variant.diamonds
                                      ? {
                                            create: variant.diamonds.map(
                                                (diamond, diamondIndex) => ({
                                                    diamond_id:
                                                        diamond.diamond_id
                                                            ? BigInt(
                                                                  diamond.diamond_id,
                                                              )
                                                            : null,
                                                    diamonds_count:
                                                        diamond.diamonds_count,
                                                    metadata:
                                                        (diamond.metadata ||
                                                            {}) as Prisma.InputJsonValue,
                                                    display_order: diamondIndex,
                                                }),
                                            ),
                                        }
                                      : undefined,
                              })),
                          }
                        : undefined,
                },
                include: {
                    product_medias: {
                        orderBy: { display_order: 'asc' },
                    },
                    catalog_products: {
                        include: {
                            catalogs: true,
                        },
                    },
                    product_variants: {
                        include: {
                            product_variant_metals: {
                                include: {
                                    metals: true,
                                    metal_purities: true,
                                    metal_tones: true,
                                },
                                orderBy: { display_order: 'asc' },
                            },
                            product_variant_diamonds: {
                                include: {
                                    diamonds: true,
                                },
                                orderBy: { display_order: 'asc' },
                            },
                        },
                    },
                },
            });

            return {
                success: true,
                message: 'Product created successfully',
                data: this.formatProductResponse(product),
            };
        });
    }

    async update(id: number, dto: UpdateProductDto, mediaFiles: string[] = []) {
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(id) },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Check SKU uniqueness if being updated
        if (dto.sku && dto.sku !== product.sku) {
            const existing = await this.prisma.products.findUnique({
                where: { sku: dto.sku },
            });
            if (existing) {
                throw new ConflictException(
                    'Product with this SKU already exists',
                );
            }
        }

        // Validate brand and category if being updated
        if (dto.brand_id) {
            const brand = await this.prisma.brands.findUnique({
                where: { id: BigInt(dto.brand_id) },
            });
            if (!brand) {
                throw new NotFoundException('Brand not found');
            }
        }

        if (dto.category_id) {
            const category = await this.prisma.categories.findUnique({
                where: { id: BigInt(dto.category_id) },
            });
            if (!category) {
                throw new NotFoundException('Category not found');
            }
        }

        // Prepare update data
        const updateData: {
            name?: string;
            sku?: string;
            titleline?: string | null;
            description?: string | null;
            collection?: string | null;
            producttype?: string | null;
            gender?: string | null;
            making_charge_amount?: number | null;
            making_charge_percentage?: number | null;
            is_active?: boolean;
            metadata?: any;
            brand_id?: bigint;
            category_id?: bigint;
            subcategory_ids?: number[];
            style_ids?: any;
            product_medias?: any;
            product_variants?: any;
        } = {};

        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.sku !== undefined) updateData.sku = dto.sku;
        if (dto.titleline !== undefined) updateData.titleline = dto.titleline;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.collection !== undefined)
            updateData.collection = dto.collection;
        if (dto.producttype !== undefined)
            updateData.producttype = dto.producttype;
        if (dto.gender !== undefined) updateData.gender = dto.gender;
        if (dto.making_charge_amount !== undefined)
            updateData.making_charge_amount = dto.making_charge_amount;
        if (dto.making_charge_percentage !== undefined)
            updateData.making_charge_percentage = dto.making_charge_percentage;
        if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
        if (dto.metadata !== undefined)
            updateData.metadata = dto.metadata as Prisma.InputJsonValue;

        if (dto.brand_id !== undefined) {
            updateData.brand_id = BigInt(dto.brand_id);
        }

        if (dto.category_id !== undefined) {
            updateData.category_id = BigInt(dto.category_id);
        }

        if (dto.subcategory_ids !== undefined) {
            updateData.subcategory_ids = dto.subcategory_ids;
        }

        if (dto.style_ids !== undefined) {
            updateData.style_ids =
                dto.style_ids && dto.style_ids.length > 0
                    ? (dto.style_ids as Prisma.InputJsonValue)
                    : Prisma.JsonNull;
        }

        // Handle catalog updates (delete all and recreate)
        // Note: catalog_products is a many-to-many relationship, handle separately
        let catalogIdsToConnect: bigint[] = [];
        if (dto.catalog_ids !== undefined) {
            await this.prisma.catalog_products.deleteMany({
                where: { product_id: BigInt(id) },
            });
            if (dto.catalog_ids && dto.catalog_ids.length > 0) {
                catalogIdsToConnect = dto.catalog_ids.map((id) => BigInt(id));
            }
        }

        // Handle media updates (delete all and recreate)
        // Note: product_medias is a separate table, so we delete existing records and create new ones
        if (dto.media !== undefined || mediaFiles.length > 0) {
            await this.prisma.product_medias.deleteMany({
                where: { product_id: BigInt(id) },
            });
            const mediaData = this.buildMediaData(dto.media, mediaFiles);
            if (mediaData) {
                updateData.product_medias = mediaData;
            }
        }

        // Handle variants updates (delete all and recreate)
        // Note: product_variants, product_variant_metals, and product_variant_diamonds
        // are separate tables, so we delete existing records and create new ones
        if (dto.variants !== undefined) {
            // First, get all variant IDs to delete related metals and diamonds
            const variants = await this.prisma.product_variants.findMany({
                where: { product_id: BigInt(id) },
                select: { id: true },
            });

            const variantIds = variants.map((v) => v.id);

            // Delete records from product_variant_metals and product_variant_diamonds tables
            if (variantIds.length > 0) {
                await Promise.all([
                    this.prisma.product_variant_metals.deleteMany({
                        where: { product_variant_id: { in: variantIds } },
                    }),
                    this.prisma.product_variant_diamonds.deleteMany({
                        where: { product_variant_id: { in: variantIds } },
                    }),
                ]);
            }

            // Delete records from product_variants table
            await this.prisma.product_variants.deleteMany({
                where: { product_id: BigInt(id) },
            });

            if (dto.variants && dto.variants.length > 0) {
                updateData.product_variants = {
                    create: dto.variants.map((variant) => ({
                        sku: variant.sku,
                        label: variant.label,
                        size_id: variant.size_id
                            ? BigInt(variant.size_id)
                            : null,
                        inventory_quantity: variant.inventory_quantity,
                        is_default: variant.is_default ?? false,
                        metadata: (variant.metadata ||
                            {}) as Prisma.InputJsonValue,
                        product_variant_metals: variant.metals
                            ? {
                                  create: variant.metals.map((metal) => ({
                                      metal_id: BigInt(metal.metal_id),
                                      metal_purity_id: metal.metal_purity_id
                                          ? BigInt(metal.metal_purity_id)
                                          : null,
                                      metal_tone_id: metal.metal_tone_id
                                          ? BigInt(metal.metal_tone_id)
                                          : null,
                                      metal_weight: metal.metal_weight,
                                      metadata: (metal.metadata ||
                                          {}) as Prisma.InputJsonValue,
                                      display_order: 0,
                                  })),
                              }
                            : undefined,
                        product_variant_diamonds: variant.diamonds
                            ? {
                                  create: variant.diamonds.map((diamond) => ({
                                      diamond_id: diamond.diamond_id
                                          ? BigInt(diamond.diamond_id)
                                          : null,
                                      diamonds_count: diamond.diamonds_count,
                                      metadata: (diamond.metadata ||
                                          {}) as Prisma.InputJsonValue,
                                      display_order: 0,
                                  })),
                              }
                            : undefined,
                    })),
                };
            }
        }

        const updatedProduct = await this.prisma.products.update({
            where: { id: BigInt(id) },
            data: updateData,
            include: {
                product_medias: {
                    orderBy: { display_order: 'asc' },
                },
                catalog_products: {
                    include: {
                        catalogs: true,
                    },
                },
                product_variants: {
                    include: {
                        product_variant_metals: {
                            include: {
                                metals: true,
                                metal_purities: true,
                                metal_tones: true,
                            },
                            orderBy: { display_order: 'asc' },
                        },
                        product_variant_diamonds: {
                            include: {
                                diamonds: true,
                            },
                            orderBy: { display_order: 'asc' },
                        },
                    },
                },
            },
        });

        // Create catalog_products records if needed
        if (catalogIdsToConnect.length > 0) {
            await this.prisma.catalog_products.createMany({
                data: catalogIdsToConnect.map((catalogId) => ({
                    product_id: BigInt(id),
                    catalog_id: catalogId,
                })),
                skipDuplicates: true,
            });
            // Reload product with updated catalog_products
            const reloadedProduct = await this.prisma.products.findUnique({
                where: { id: BigInt(id) },
                include: {
                    product_medias: {
                        orderBy: { display_order: 'asc' },
                    },
                    catalog_products: {
                        include: {
                            catalogs: true,
                        },
                    },
                    product_variants: {
                        include: {
                            product_variant_metals: {
                                include: {
                                    metals: true,
                                    metal_purities: true,
                                    metal_tones: true,
                                },
                                orderBy: { display_order: 'asc' },
                            },
                            product_variant_diamonds: {
                                include: {
                                    diamonds: true,
                                },
                                orderBy: { display_order: 'asc' },
                            },
                        },
                    },
                },
            });

            return {
                success: true,
                message: 'Product updated successfully',
                data: this.formatProductResponse(reloadedProduct!),
            };
        }

        return {
            success: true,
            message: 'Product updated successfully',
            data: this.formatProductResponse(updatedProduct),
        };
    }

    async remove(id: number) {
        // Verify product exists (throws NotFoundException if not found)
        await this.findOne(id);

        // Delete related data from separate tables
        // Note: These are separate tables with foreign keys, so we delete explicitly
        // (Cascade delete should handle this, but we're being explicit for clarity)
        const variants = await this.prisma.product_variants.findMany({
            where: { product_id: BigInt(id) },
            select: { id: true },
        });

        const variantIds = variants.map((v) => v.id);

        // Delete from product_variant_metals and product_variant_diamonds tables
        if (variantIds.length > 0) {
            await Promise.all([
                this.prisma.product_variant_metals.deleteMany({
                    where: { product_variant_id: { in: variantIds } },
                }),
                this.prisma.product_variant_diamonds.deleteMany({
                    where: { product_variant_id: { in: variantIds } },
                }),
            ]);
        }

        // Delete from product_variants table (product_medias will cascade delete)
        // Finally delete from products table
        await this.prisma.products.delete({
            where: { id: BigInt(id) },
        });

        return { success: true, message: 'Product deleted successfully' };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Get all variants for these products from product_variants table
        const variants = await this.prisma.product_variants.findMany({
            where: { product_id: { in: bigIntIds } },
            select: { id: true },
        });

        const variantIds = variants.map((v) => v.id);

        // Delete from product_variant_metals and product_variant_diamonds tables
        if (variantIds.length > 0) {
            await Promise.all([
                this.prisma.product_variant_metals.deleteMany({
                    where: { product_variant_id: { in: variantIds } },
                }),
                this.prisma.product_variant_diamonds.deleteMany({
                    where: { product_variant_id: { in: variantIds } },
                }),
            ]);
        }

        // Delete from products table (cascade will handle product_medias and product_variants)
        await this.prisma.products.deleteMany({
            where: { id: { in: bigIntIds } },
        });

        return {
            success: true,
            message: 'Products deleted successfully',
        };
    }

    private buildMediaData(
        dtoMedia?: Array<{
            type: string;
            url: string;
            display_order: number;
            metadata?: Record<string, unknown>;
        }>,
        uploadedFiles: string[] = [],
    ):
        | {
              create: Array<{
                  type: string;
                  url: string;
                  display_order: number;
                  metadata: Prisma.InputJsonValue;
              }>;
          }
        | undefined {
        const mediaItems: Array<{
            type: string;
            url: string;
            display_order: number;
            metadata: Prisma.InputJsonValue;
        }> = [];

        // Add uploaded files first
        uploadedFiles.forEach((filePath, index) => {
            mediaItems.push({
                type: 'image',
                url: `/${filePath}`, // Add leading slash for URL
                display_order: index,
                metadata: {} as Prisma.InputJsonValue,
            });
        });

        // Add DTO media (if any) after uploaded files
        if (dtoMedia && dtoMedia.length > 0) {
            dtoMedia.forEach((media, index) => {
                // Skip if URL is already in uploaded files
                if (!uploadedFiles.some((file) => media.url.includes(file))) {
                    mediaItems.push({
                        type: media.type || 'image',
                        url: media.url,
                        display_order: uploadedFiles.length + index,
                        metadata: (media.metadata ||
                            {}) as Prisma.InputJsonValue,
                    });
                }
            });
        }

        return mediaItems.length > 0
            ? {
                  create: mediaItems,
              }
            : undefined;
    }

    private formatProductResponse(
        product: ProductWithRelations,
    ): ProductDetailResponseDto {
        return {
            id: Number(product.id),
            name: product.name,
            sku: product.sku,
            titleline: product.titleline,
            brand_id: Number(product.brand_id),
            category_id: Number(product.category_id),
            subcategory_ids: (product.subcategory_ids as number[]) || [],
            style_ids: (product.style_ids as number[]) || [],
            catalog_ids: product.catalog_products
                ? product.catalog_products.map((cp) => Number(cp.catalog_id))
                : [],
            description: product.description,
            collection: product.collection,
            producttype: product.producttype,
            gender: product.gender,
            making_charge_amount: product.making_charge_amount
                ? Number(product.making_charge_amount)
                : null,
            making_charge_percentage: product.making_charge_percentage
                ? Number(product.making_charge_percentage)
                : null,
            is_active: product.is_active,
            metadata: (product.metadata as Record<string, unknown>) || {},
            media: product.product_medias.map((media) => ({
                id: Number(media.id),
                type: media.type,
                url: media.url,
                display_order: media.display_order,
                metadata: (media.metadata as Record<string, unknown>) || {},
            })),
            variants: product.product_variants.map((variant) => ({
                id: Number(variant.id),
                sku: variant.sku,
                label: variant.label,
                size_id: variant.size_id ? Number(variant.size_id) : null,
                inventory_quantity: variant.inventory_quantity,
                is_default: variant.is_default,
                metadata: (variant.metadata as Record<string, unknown>) || {},
                metals: variant.product_variant_metals.map((metal) => ({
                    id: Number(metal.id),
                    metal_id: Number(metal.metal_id),
                    metal_purity_id: metal.metal_purity_id
                        ? Number(metal.metal_purity_id)
                        : null,
                    metal_tone_id: metal.metal_tone_id
                        ? Number(metal.metal_tone_id)
                        : null,
                    metal_weight: Number(metal.metal_weight),
                    metadata: (metal.metadata as Record<string, unknown>) || {},
                })),
                diamonds: variant.product_variant_diamonds.map((diamond) => ({
                    id: Number(diamond.id),
                    diamond_id: diamond.diamond_id
                        ? Number(diamond.diamond_id)
                        : null,
                    diamonds_count: diamond.diamonds_count ?? 0,
                    metadata:
                        (diamond.metadata as Record<string, unknown>) || {},
                })),
            })),
        };
    }
}
