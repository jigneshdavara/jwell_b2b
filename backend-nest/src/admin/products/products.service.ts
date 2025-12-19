import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateProductDto,
    UpdateProductDto,
    ProductFilterDto,
} from './dto/product.dto';
import { ProductVariantsService } from './product-variants/product-variants.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private variantSync: ProductVariantsService,
    ) {}

    async findAll(filters: ProductFilterDto) {
        const page = parseInt(filters.page || '1');
        const perPage = parseInt(filters.per_page || '10');
        const skip = (page - 1) * perPage;

        const where: any = {};

        if (filters.search) {
            where.OR = [
                { sku: { contains: filters.search, mode: 'insensitive' } },
                { name: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.status) {
            where.is_active = filters.status === 'active';
        }

        const [items, total] = await Promise.all([
            this.prisma.products.findMany({
                where,
                skip,
                take: perPage,
                include: {
                    brands: { select: { id: true, name: true } },
                    categories: { select: { id: true, name: true } },
                    _count: { select: { product_variants: true } },
                },
                orderBy: { updated_at: 'desc' },
            }),
            this.prisma.products.count({ where }),
        ]);

        const formattedItems = items.map((product) => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            is_active: product.is_active,
            brand: product.brands,
            category: product.categories,
            variants_count: product._count.product_variants,
        }));

        return {
            items: formattedItems,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(id) },
            include: {
                brands: true,
                categories: {
                    include: {
                        category_sizes: {
                            include: { sizes: true },
                        },
                    },
                },
                catalog_products: { select: { catalog_id: true } },
                product_medias: { orderBy: { display_order: 'asc' } },
                product_variants: {
                    orderBy: [{ is_default: 'desc' }, { label: 'asc' }],
                    include: {
                        product_variant_metals: {
                            include: {
                                metals: true,
                                metal_purities: true,
                                metal_tones: true,
                            },
                        },
                        product_variant_diamonds: {
                            include: { diamonds: true },
                        },
                        sizes: true,
                    },
                },
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return this.formatProductForEdit(product);
    }

    async create(dto: CreateProductDto, mediaFiles?: Express.Multer.File[]) {
        return await this.prisma.$transaction(async (tx) => {
            const {
                variants,
                catalog_ids,
                category_ids,
                style_ids,
                making_charge_types,
                ...productData
            } = dto;

            const product = await tx.products.create({
                data: {
                    name: productData.name,
                    titleline: productData.titleline,
                    brand_id: BigInt(productData.brand_id),
                    category_id: BigInt(productData.category_id),
                    sku: productData.sku,
                    description: productData.description,
                    collection: productData.collection,
                    producttype: productData.producttype,
                    gender: productData.gender,
                    making_charge_amount: productData.making_charge_amount,
                    making_charge_percentage:
                        productData.making_charge_percentage,
                    is_active: productData.is_active ?? true,
                    subcategory_ids: category_ids || [],
                    style_ids: style_ids || [],
                    metadata: {
                        ...(productData.metadata || {}),
                        making_charge_types: making_charge_types || [],
                    },
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            await this.variantSync.sync(product.id, variants, tx);

            if (catalog_ids && catalog_ids.length > 0) {
                await tx.catalog_products.createMany({
                    data: catalog_ids.map((id) => ({
                        product_id: product.id,
                        catalog_id: BigInt(id),
                    })),
                });
            }

            if (mediaFiles && mediaFiles.length > 0) {
                await this.syncMedia(product.id, mediaFiles, [], tx);
            }

            return product;
        });
    }

    async update(
        id: number,
        dto: UpdateProductDto,
        mediaFiles?: Express.Multer.File[],
    ) {
        const productRecord = await this.prisma.products.findUnique({
            where: { id: BigInt(id) },
        });
        if (!productRecord) throw new NotFoundException('Product not found');

        return await this.prisma.$transaction(async (tx) => {
            const {
                variants,
                catalog_ids,
                category_ids,
                style_ids,
                making_charge_types,
                removed_media_ids,
                ...productData
            } = dto;

            const product = await tx.products.update({
                where: { id: BigInt(id) },
                data: {
                    name: productData.name,
                    titleline: productData.titleline,
                    brand_id: BigInt(productData.brand_id),
                    category_id: BigInt(productData.category_id),
                    sku: productData.sku,
                    description: productData.description,
                    collection: productData.collection,
                    producttype: productData.producttype,
                    gender: productData.gender,
                    making_charge_amount: productData.making_charge_amount,
                    making_charge_percentage:
                        productData.making_charge_percentage,
                    is_active: productData.is_active,
                    subcategory_ids: category_ids || [],
                    style_ids: style_ids || [],
                    metadata: {
                        ...(productData.metadata || {}),
                        making_charge_types: making_charge_types || [],
                    },
                    updated_at: new Date(),
                },
            });

            await this.variantSync.sync(product.id, variants, tx);

            // Sync catalogs
            await tx.catalog_products.deleteMany({
                where: { product_id: product.id },
            });
            if (catalog_ids && catalog_ids.length > 0) {
                await tx.catalog_products.createMany({
                    data: catalog_ids.map((cid) => ({
                        product_id: product.id,
                        catalog_id: BigInt(cid),
                    })),
                });
            }

            // Sync media
            await this.syncMedia(
                product.id,
                mediaFiles || [],
                removed_media_ids || [],
                tx,
            );

            return product;
        });
    }

    async remove(id: number) {
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(id) },
            include: { product_medias: true },
        });
        if (!product) throw new NotFoundException('Product not found');

        // Delete media files
        for (const media of product.product_medias) {
            this.deleteMediaFile(media);
        }

        return await this.prisma.products.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkDestroy(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        const products = await this.prisma.products.findMany({
            where: { id: { in: bigIntIds } },
            include: { product_medias: true },
        });

        for (const product of products) {
            for (const media of product.product_medias) {
                this.deleteMediaFile(media);
            }
        }

        return await this.prisma.products.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }

    async bulkStatus(ids: number[], action: string) {
        const isActive = action === 'activate';
        return await this.prisma.products.updateMany({
            where: { id: { in: ids.map((id) => BigInt(id)) } },
            data: { is_active: isActive, updated_at: new Date() },
        });
    }

    async copy(id: number) {
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(id) },
            include: {
                product_variants: {
                    include: {
                        product_variant_metals: true,
                        product_variant_diamonds: true,
                    },
                },
                product_medias: true,
                catalog_products: true,
            },
        });

        if (!product) throw new NotFoundException('Product not found');

        return await this.prisma.$transaction(async (tx) => {
            const newSku = await this.generateProductSku(product.sku, tx);

            const replica = await tx.products.create({
                data: {
                    name: `${product.name} (Copy)`,
                    sku: newSku,
                    titleline: product.titleline,
                    brand_id: product.brand_id,
                    category_id: product.category_id,
                    subcategory_ids: product.subcategory_ids || [],
                    style_ids: product.style_ids || [],
                    collection: product.collection,
                    producttype: product.producttype,
                    gender: product.gender,
                    description: product.description,
                    making_charge_amount: product.making_charge_amount,
                    making_charge_percentage: product.making_charge_percentage,
                    is_active: false,
                    metadata: product.metadata || {},
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            // Duplicate variants
            for (const variant of product.product_variants) {
                const variantAttributes = {
                    product_id: replica.id,
                    sku: variant.sku
                        ? await this.generateVariantSku(variant.sku, tx)
                        : null,
                    label: variant.label,
                    size_id: variant.size_id,
                    inventory_quantity: variant.inventory_quantity,
                    is_default: variant.is_default,
                    metadata: variant.metadata || {},
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                const newVariant = await tx.product_variants.create({
                    data: variantAttributes,
                });

                // Metals
                await tx.product_variant_metals.createMany({
                    data: variant.product_variant_metals.map((m) => ({
                        product_variant_id: newVariant.id,
                        metal_id: m.metal_id,
                        metal_purity_id: m.metal_purity_id,
                        metal_tone_id: m.metal_tone_id,
                        metal_weight: m.metal_weight,
                        metadata: m.metadata || {},
                        display_order: m.display_order,
                        created_at: new Date(),
                        updated_at: new Date(),
                    })),
                });

                // Diamonds
                await tx.product_variant_diamonds.createMany({
                    data: variant.product_variant_diamonds.map((d) => ({
                        product_variant_id: newVariant.id,
                        diamond_id: d.diamond_id,
                        diamonds_count: d.diamonds_count,
                        metadata: d.metadata || {},
                        display_order: d.display_order,
                        created_at: new Date(),
                        updated_at: new Date(),
                    })),
                });
            }

            // Duplicate media records (files remain the same)
            await tx.product_medias.createMany({
                data: product.product_medias.map((m) => ({
                    product_id: replica.id,
                    type: m.type,
                    url: m.url,
                    display_order: m.display_order,
                    metadata: m.metadata || {},
                    created_at: new Date(),
                    updated_at: new Date(),
                })),
            });

            // Catalogs
            await tx.catalog_products.createMany({
                data: product.catalog_products.map((cp) => ({
                    product_id: replica.id,
                    catalog_id: cp.catalog_id,
                })),
            });

            return replica;
        });
    }

    async getFormOptions() {
        const [
            brands,
            categories,
            catalogs,
            diamonds,
            metals,
            metalPurities,
            metalTones,
            sizes,
            customerGroups,
        ] = await Promise.all([
            this.prisma.brands.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.categories.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.catalogs.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.diamonds.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.metals.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.metal_purities.findMany({
                where: { is_active: true },
                include: { metals: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.metal_tones.findMany({
                where: { is_active: true },
                include: { metals: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.sizes.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.customer_groups.findMany({
                where: { is_active: true },
                orderBy: { name: 'asc' },
            }),
        ]);

        return {
            brands,
            categories,
            catalogs,
            diamonds,
            metals,
            metalPurities,
            metalTones,
            sizes,
            customerGroups,
        };
    }

    private async syncMedia(
        productId: bigint,
        uploads: Express.Multer.File[],
        removedIds: number[],
        tx: any,
    ) {
        if (removedIds.length > 0) {
            const mediaToDelete = await tx.product_medias.findMany({
                where: { id: { in: removedIds.map((id) => BigInt(id)) } },
            });
            for (const m of mediaToDelete) {
                this.deleteMediaFile(m);
            }
            await tx.product_medias.deleteMany({
                where: { id: { in: removedIds.map((id) => BigInt(id)) } },
            });
        }

        if (uploads.length === 0) return;

        const maxDisplayOrder = await tx.product_medias.aggregate({
            where: { product_id: productId },
            _max: { display_order: true },
        });

        let displayOrder = (maxDisplayOrder._max.display_order ?? -1) + 1;

        for (const file of uploads) {
            const type = file.mimetype.startsWith('video/') ? 'video' : 'image';
            await tx.product_medias.create({
                data: {
                    product_id: productId,
                    type,
                    url: `/storage/products/${file.filename}`,
                    display_order: displayOrder++,
                    metadata: {
                        original_name: file.originalname,
                        size: file.size,
                        mime_type: file.mimetype,
                        storage_path: `products/${file.filename}`,
                    },
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }
    }

    private deleteMediaFile(media: any) {
        const storagePath = media.metadata?.storage_path;
        if (storagePath) {
            const fullPath = path.join(
                process.cwd(),
                'public/storage',
                storagePath,
            );
            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                } catch (err) {
                    console.error(
                        `Failed to delete media file: ${fullPath}`,
                        err,
                    );
                }
            }
        }
    }

    private async generateProductSku(
        baseSku: string,
        prisma: any,
    ): Promise<string> {
        let sku = baseSku;
        let exists = true;
        while (exists) {
            const random = Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase();
            sku = `${baseSku}-${random}`;
            const found = await prisma.products.findUnique({ where: { sku } });
            if (!found) exists = false;
        }
        return sku;
    }

    private async generateVariantSku(
        baseSku: string,
        prisma: any,
    ): Promise<string> {
        let sku = baseSku;
        let exists = true;
        while (exists) {
            const random = Math.random()
                .toString(36)
                .substring(2, 5)
                .toUpperCase();
            sku = `${baseSku}-${random}`;
            const found = await prisma.product_variants.findUnique({
                where: { sku },
            });
            if (!found) exists = false;
        }
        return sku;
    }

    private formatProductForEdit(product: any) {
        const metadata = product.metadata || {};
        return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            titleline: product.titleline,
            brand_id: product.brand_id,
            category_id: product.category_id,
            description: product.description,
            collection: product.collection,
            producttype: product.producttype,
            gender: product.gender,
            making_charge_amount: product.making_charge_amount,
            making_charge_percentage: product.making_charge_percentage,
            making_charge_types: metadata.making_charge_types || [],
            is_active: product.is_active,
            metadata: metadata,
            style_ids: product.style_ids || [],
            category_ids: product.subcategory_ids || [],
            catalog_ids: product.catalog_products.map((cp) => cp.catalog_id),
            media: product.product_medias,
            variants: product.product_variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                label: v.label,
                size_id: v.size_id,
                inventory_quantity: v.inventory_quantity,
                is_default: v.is_default,
                metadata: v.metadata || {},
                metals: v.product_variant_metals.map((m) => ({
                    id: m.id,
                    metal_id: m.metal_id,
                    metal_purity_id: m.metal_purity_id,
                    metal_tone_id: m.metal_tone_id,
                    metal_weight: m.metal_weight,
                    metadata: m.metadata || {},
                    metal: m.metals,
                    metal_purity: m.metal_purities,
                    metal_tone: m.metal_tones,
                })),
                diamonds: v.product_variant_diamonds.map((d) => ({
                    id: d.id,
                    diamond_id: d.diamond_id,
                    diamonds_count: d.diamonds_count,
                    metadata: d.metadata || {},
                    diamond: d.diamonds,
                })),
                size: v.sizes,
            })),
        };
    }
}
