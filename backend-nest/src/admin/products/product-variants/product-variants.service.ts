import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductVariantDto } from '../dto/product.dto';

@Injectable()
export class ProductVariantsService {
    constructor(private prisma: PrismaService) {}

    async sync(productId: bigint, variants: ProductVariantDto[], tx?: any) {
        const prisma = tx || this.prisma;
        const persistedIds: bigint[] = [];

        // Ensure at least one default variant
        let hasDefault = variants.some((v) => v.is_default);
        if (!hasDefault && variants.length > 0) {
            variants[0].is_default = true;
        }

        for (const variantDto of variants) {
            const { metals, diamonds, ...variantData } = variantDto;

            // Validate at least one metal
            if (!metals || metals.length === 0) {
                throw new BadRequestException(
                    `Variant "${variantDto.label}" must have at least one metal.`,
                );
            }

            const variantAttributes = {
                product_id: productId,
                sku: variantData.sku,
                label: variantData.label,
                size_id: variantData.size_id
                    ? BigInt(variantData.size_id)
                    : null,
                inventory_quantity: variantData.inventory_quantity ?? 0,
                is_default: variantData.is_default ?? false,
                metadata: variantData.metadata || {},
                updated_at: new Date(),
            };

            let variantRecord: any;

            if (variantDto.id) {
                // Update existing
                variantRecord = await prisma.product_variants.update({
                    where: { id: BigInt(variantDto.id) },
                    data: variantAttributes,
                });
            } else {
                // Check for SKU conflict within product or globally
                if (variantData.sku) {
                    const existing = await prisma.product_variants.findUnique({
                        where: { sku: variantData.sku },
                    });
                    if (existing) {
                        // Generate a unique SKU if it exists (matching Laravel logic)
                        variantAttributes.sku = await this.generateUniqueSku(
                            variantData.sku,
                            prisma,
                        );
                    }
                }

                // Create new
                variantRecord = await prisma.product_variants.create({
                    data: {
                        ...variantAttributes,
                        created_at: new Date(),
                    },
                });
            }

            persistedIds.push(variantRecord.id);

            // Sync Metals
            await this.syncMetals(variantRecord.id, metals, prisma);

            // Sync Diamonds
            if (diamonds) {
                await this.syncDiamonds(variantRecord.id, diamonds, prisma);
            } else {
                await prisma.product_variant_diamonds.deleteMany({
                    where: { product_variant_id: variantRecord.id },
                });
            }
        }

        // Delete variants not in persistedIds
        await prisma.product_variants.deleteMany({
            where: {
                product_id: productId,
                id: { notIn: persistedIds },
            },
        });
    }

    private async syncMetals(variantId: bigint, metals: any[], prisma: any) {
        const metalPersistedIds: bigint[] = [];

        for (let i = 0; i < metals.length; i++) {
            const metal = metals[i];
            const attributes = {
                product_variant_id: variantId,
                metal_id: BigInt(metal.metal_id),
                metal_purity_id: metal.metal_purity_id
                    ? BigInt(metal.metal_purity_id)
                    : null,
                metal_tone_id: metal.metal_tone_id
                    ? BigInt(metal.metal_tone_id)
                    : null,
                metal_weight: metal.metal_weight
                    ? parseFloat(metal.metal_weight.toString())
                    : null,
                metadata: metal.metadata || {},
                display_order: i,
                updated_at: new Date(),
            };

            let record: any;
            if (metal.id) {
                record = await prisma.product_variant_metals.update({
                    where: { id: BigInt(metal.id) },
                    data: attributes,
                });
            } else {
                record = await prisma.product_variant_metals.create({
                    data: {
                        ...attributes,
                        created_at: new Date(),
                    },
                });
            }
            metalPersistedIds.push(record.id);
        }

        await prisma.product_variant_metals.deleteMany({
            where: {
                product_variant_id: variantId,
                id: { notIn: metalPersistedIds },
            },
        });
    }

    private async syncDiamonds(
        variantId: bigint,
        diamonds: any[],
        prisma: any,
    ) {
        const diamondPersistedIds: bigint[] = [];

        for (let i = 0; i < diamonds.length; i++) {
            const diamond = diamonds[i];
            const attributes = {
                product_variant_id: variantId,
                diamond_id: BigInt(diamond.diamond_id),
                diamonds_count: diamond.diamonds_count ?? null,
                metadata: diamond.metadata || {},
                display_order: i,
                updated_at: new Date(),
            };

            let record: any;
            if (diamond.id) {
                record = await prisma.product_variant_diamonds.update({
                    where: { id: BigInt(diamond.id) },
                    data: attributes,
                });
            } else {
                record = await prisma.product_variant_diamonds.create({
                    data: {
                        ...attributes,
                        created_at: new Date(),
                    },
                });
            }
            diamondPersistedIds.push(record.id);
        }

        await prisma.product_variant_diamonds.deleteMany({
            where: {
                product_variant_id: variantId,
                id: { notIn: diamondPersistedIds },
            },
        });
    }

    private async generateUniqueSku(
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
}
