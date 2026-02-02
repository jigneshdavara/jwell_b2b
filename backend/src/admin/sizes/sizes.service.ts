import {
    ConflictException,
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSizeDto, UpdateSizeDto } from './dto/size.dto';

@Injectable()
export class SizesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number, activeOnly: boolean = false) {
        const skip = (page - 1) * perPage;
        const whereClause = activeOnly ? { is_active: true } : {};
        const [items, total] = await Promise.all([
            this.prisma.sizes.findMany({
                where: whereClause,
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.sizes.count({ where: whereClause }),
        ]);

        return {
            items: items.map((item) => ({
                ...item,
                id: Number(item.id),
            })),
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const size = await this.prisma.sizes.findUnique({
            where: { id: BigInt(id) },
        });
        if (!size) {
            throw new NotFoundException('Size not found');
        }
        return {
            ...size,
            id: Number(size.id),
        };
    }

    async create(dto: CreateSizeDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.sizes.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.sizes.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException('Size with this name already exists');
        }
        if (existingByCode) {
            throw new ConflictException('Size with this code already exists');
        }

        await this.prisma.sizes.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order ?? 0,
            },
        });
        return {
            success: true,
            message: 'Size created successfully',
        };
    }

    async update(id: number, dto: UpdateSizeDto) {
        const existing = await this.findOne(id);
        const sizeId = BigInt(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.sizes.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Size with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.sizes.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Size with this code already exists',
                );
            }
        }

        // Check if trying to pause/deactivate size that is assigned to categories or products
        if (dto.is_active === false && existing.is_active === true) {
            const [categoriesCount, productsCount] = await Promise.all([
                this.prisma.category_sizes.count({
                    where: {
                        size_id: sizeId,
                    },
                }),
                this.prisma.product_variants.count({
                    where: {
                        size_id: sizeId,
                    },
                }),
            ]);

            if (categoriesCount > 0 && productsCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this size. It is currently assigned to ${categoriesCount} categor(ies) and ${productsCount} product variant(s). Please remove the size from all categories and products first, then pause the size.`,
                );
            }

            if (categoriesCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this size. It is currently assigned to ${categoriesCount} categor(ies). Please remove the size from all categories first, then pause the size.`,
                );
            }

            if (productsCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this size. It is currently assigned to ${productsCount} product variant(s). Please remove the size from all products first, then pause the size.`,
                );
            }
        }

        await this.prisma.sizes.update({
            where: { id: sizeId },
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
            },
        });
        return {
            success: true,
            message: 'Size updated successfully',
        };
    }

    async remove(id: number) {
        const sizeId = BigInt(id);
        const size = await this.prisma.sizes.findUnique({
            where: { id: sizeId },
        });
        if (!size) throw new NotFoundException('Size not found');

        // Check if size is assigned to categories or products
        const [categoriesCount, productsCount] = await Promise.all([
            this.prisma.category_sizes.count({
                where: {
                    size_id: sizeId,
                },
            }),
            this.prisma.product_variants.count({
                where: {
                    size_id: sizeId,
                },
            }),
        ]);

        if (categoriesCount > 0 && productsCount > 0) {
            throw new BadRequestException(
                `Cannot delete this size. It is currently assigned to ${categoriesCount} categor(ies) and ${productsCount} product variant(s). Please remove the size from all categories and products first, then delete the size.`,
            );
        }

        if (categoriesCount > 0) {
            throw new BadRequestException(
                `Cannot delete this size. It is currently assigned to ${categoriesCount} categor(ies). Please remove the size from all categories first, then delete the size.`,
            );
        }

        if (productsCount > 0) {
            throw new BadRequestException(
                `Cannot delete this size. It is currently assigned to ${productsCount} product variant(s). Please remove the size from all products first, then delete the size.`,
            );
        }

        await this.prisma.sizes.delete({
            where: { id: sizeId },
        });
        return {
            success: true,
            message: 'Size deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Check if any of the sizes are assigned to categories or products
        const [sizesWithCategories, sizesWithProducts] = await Promise.all([
            this.prisma.category_sizes.findMany({
                where: {
                    size_id: { in: bigIntIds },
                },
                select: {
                    size_id: true,
                },
                distinct: ['size_id'],
            }),
            this.prisma.product_variants.findMany({
                where: {
                    size_id: { in: bigIntIds },
                },
                select: {
                    size_id: true,
                },
                distinct: ['size_id'],
            }),
        ]);

        const categorySizeIds = sizesWithCategories
            .map((c) => c.size_id)
            .filter((id): id is bigint => id !== null);
        const productSizeIds = sizesWithProducts
            .map((p) => p.size_id)
            .filter((id): id is bigint => id !== null);

        const allConflictingSizeIds = [
            ...new Set([...categorySizeIds, ...productSizeIds]),
        ];

        // Find IDs that can be deleted (not in conflicts)
        const deletableIds = bigIntIds.filter(
            (id) => !allConflictingSizeIds.includes(id),
        );

        // Delete only the items without conflicts
        let deletedCount = 0;
        if (deletableIds.length > 0) {
            const result = await this.prisma.sizes.deleteMany({
                where: { id: { in: deletableIds } },
            });
            deletedCount = result.count;
        }

        // Build response message
        if (allConflictingSizeIds.length === 0) {
            // All items deleted successfully
            return {
                success: true,
                message: `${deletedCount} size${deletedCount === 1 ? '' : 's'} deleted successfully`,
            };
        }

        // Get size details with counts for conflicts
        const sizeDetails = await Promise.all(
            allConflictingSizeIds.map(async (sizeId) => {
                const size = await this.prisma.sizes.findUnique({
                    where: { id: sizeId },
                    select: { name: true },
                });

                const categoriesCount = categorySizeIds.includes(sizeId)
                    ? await this.prisma.category_sizes.count({
                          where: { size_id: sizeId },
                      })
                    : 0;

                const productsCount = productSizeIds.includes(sizeId)
                    ? await this.prisma.product_variants.count({
                          where: { size_id: sizeId },
                      })
                    : 0;

                return {
                    id: sizeId,
                    name: size?.name || 'Unknown',
                    categoriesCount,
                    productsCount,
                };
            }),
        );

        const conflicts: string[] = [];
        sizeDetails.forEach((detail) => {
            if (detail.categoriesCount > 0 && detail.productsCount > 0) {
                conflicts.push(
                    `${detail.name} (assigned to ${detail.categoriesCount} categor(ies) and ${detail.productsCount} product variant(s))`,
                );
            } else if (detail.categoriesCount > 0) {
                conflicts.push(
                    `${detail.name} (assigned to ${detail.categoriesCount} categor(ies))`,
                );
            } else if (detail.productsCount > 0) {
                conflicts.push(
                    `${detail.name} (assigned to ${detail.productsCount} product variant(s))`,
                );
            }
        });

        if (deletedCount > 0) {
            // Partial success
            return {
                success: true,
                message: `${deletedCount} size${deletedCount === 1 ? '' : 's'} deleted successfully. Cannot delete: ${conflicts.join(', ')}. Please remove them from all categories and products first.`,
            };
        } else {
            // All failed
            throw new BadRequestException(
                `Cannot delete size(s): ${conflicts.join(', ')}. Please remove the size(s) from all categories and products first, then delete the size(s).`,
            );
        }
    }
}
