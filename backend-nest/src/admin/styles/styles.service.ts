import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStyleDto, UpdateStyleDto } from './dto/style.dto';

@Injectable()
export class StylesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number, activeOnly: boolean = false) {
        const skip = (page - 1) * perPage;
        const whereClause = activeOnly ? { is_active: true } : {};
        const [items, total] = await Promise.all([
            this.prisma.styles.findMany({
                where: whereClause,
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.styles.count({ where: whereClause }),
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
        const style = await this.prisma.styles.findUnique({
            where: { id: BigInt(id) },
        });
        if (!style) {
            throw new NotFoundException('Style not found');
        }
        return {
            ...style,
            id: Number(style.id),
        };
    }

    async create(dto: CreateStyleDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.styles.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.styles.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException('Style with this name already exists');
        }
        if (existingByCode) {
            throw new ConflictException('Style with this code already exists');
        }

        await this.prisma.styles.create({
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
            message: 'Style created successfully',
        };
    }

    async update(id: number, dto: UpdateStyleDto) {
        const existing = await this.findOne(id);
        const styleId = BigInt(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.styles.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Style with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.styles.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Style with this code already exists',
                );
            }
        }

        // Check if trying to pause/deactivate style that is assigned to categories or products
        if (dto.is_active === false && existing.is_active === true) {
            const styleIdNumber = Number(id);

            const [categoriesCount, allProducts] = await Promise.all([
                this.prisma.category_styles.count({
                    where: {
                        style_id: styleId,
                    },
                }),
                this.prisma.products.findMany({
                    select: {
                        id: true,
                        style_ids: true,
                    },
                }),
            ]);

            // Filter products where this style ID is in the style_ids array
            const matchingProducts = allProducts.filter((product) => {
                if (!product.style_ids) return false;
                const styleIds = product.style_ids as number[];
                return (
                    Array.isArray(styleIds) && styleIds.includes(styleIdNumber)
                );
            });

            if (categoriesCount > 0 && matchingProducts.length > 0) {
                throw new BadRequestException(
                    `Cannot pause this style. It is currently assigned to ${categoriesCount} categor(ies) and ${matchingProducts.length} product(s). Please remove the style from all categories and products first, then pause the style.`,
                );
            }

            if (categoriesCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this style. It is currently assigned to ${categoriesCount} categor(ies). Please remove the style from all categories first, then pause the style.`,
                );
            }

            if (matchingProducts.length > 0) {
                throw new BadRequestException(
                    `Cannot pause this style. It is currently assigned to ${matchingProducts.length} product(s). Please remove the style from all products first, then pause the style.`,
                );
            }
        }

        await this.prisma.styles.update({
            where: { id: styleId },
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
            message: 'Style updated successfully',
        };
    }

    async remove(id: number) {
        const styleId = BigInt(id);
        const style = await this.prisma.styles.findUnique({
            where: { id: styleId },
        });
        if (!style) throw new NotFoundException('Style not found');

        // Check if style is assigned to categories or products
        const styleIdNumber = Number(id);

        const [categoriesCount, allProducts] = await Promise.all([
            this.prisma.category_styles.count({
                where: {
                    style_id: styleId,
                },
            }),
            this.prisma.products.findMany({
                select: {
                    id: true,
                    style_ids: true,
                },
            }),
        ]);

        // Filter products where this style ID is in the style_ids array
        const matchingProducts = allProducts.filter((product) => {
            if (!product.style_ids) return false;
            const styleIds = product.style_ids as number[];
            return Array.isArray(styleIds) && styleIds.includes(styleIdNumber);
        });

        if (categoriesCount > 0 && matchingProducts.length > 0) {
            throw new BadRequestException(
                `Cannot delete this style. It is currently assigned to ${categoriesCount} categor(ies) and ${matchingProducts.length} product(s). Please remove the style from all categories and products first, then delete the style.`,
            );
        }

        if (categoriesCount > 0) {
            throw new BadRequestException(
                `Cannot delete this style. It is currently assigned to ${categoriesCount} categor(ies). Please remove the style from all categories first, then delete the style.`,
            );
        }

        if (matchingProducts.length > 0) {
            throw new BadRequestException(
                `Cannot delete this style. It is currently assigned to ${matchingProducts.length} product(s). Please remove the style from all products first, then delete the style.`,
            );
        }

        await this.prisma.styles.delete({
            where: { id: styleId },
        });
        return {
            success: true,
            message: 'Style deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        const styleIdsAsNumbers = ids.map((id) => Number(id));

        // Check if any of the styles are assigned to categories or products
        const [stylesWithCategories, allProducts] = await Promise.all([
            this.prisma.category_styles.findMany({
                where: {
                    style_id: { in: bigIntIds },
                },
                select: {
                    style_id: true,
                },
                distinct: ['style_id'],
            }),
            this.prisma.products.findMany({
                select: {
                    id: true,
                    style_ids: true,
                },
            }),
        ]);

        // Find which style IDs from the delete list are in style_ids
        const stylesUsedInProducts = new Set<number>();

        allProducts.forEach((product) => {
            if (!product.style_ids) return;
            const styleIds = product.style_ids as number[];
            if (Array.isArray(styleIds)) {
                styleIds.forEach((styleId) => {
                    if (styleIdsAsNumbers.includes(styleId)) {
                        stylesUsedInProducts.add(styleId);
                    }
                });
            }
        });

        const categoryStyleIds = stylesWithCategories
            .map((c) => c.style_id)
            .filter((id): id is bigint => id !== null)
            .map((id) => Number(id));

        const allConflictingStyleIds = [
            ...new Set([
                ...categoryStyleIds,
                ...Array.from(stylesUsedInProducts),
            ]),
        ];

        // Convert conflicting style IDs to BigInt for comparison
        const conflictingStyleBigIntIds = allConflictingStyleIds.map((id) =>
            BigInt(id),
        );

        // Find IDs that can be deleted (not in conflicts)
        const deletableIds = bigIntIds.filter(
            (id) => !conflictingStyleBigIntIds.includes(id),
        );

        // Delete only the items without conflicts
        let deletedCount = 0;
        if (deletableIds.length > 0) {
            const result = await this.prisma.styles.deleteMany({
                where: { id: { in: deletableIds } },
            });
            deletedCount = result.count;
        }

        // Build response message
        if (allConflictingStyleIds.length === 0) {
            // All items deleted successfully
            return {
                success: true,
                message: `${deletedCount} style${deletedCount === 1 ? '' : 's'} deleted successfully`,
            };
        }

        // Get style details with counts for conflicts
        const styleDetails = await Promise.all(
            allConflictingStyleIds.map(async (styleId) => {
                const style = await this.prisma.styles.findUnique({
                    where: { id: BigInt(styleId) },
                    select: { name: true },
                });

                const categoriesCount = categoryStyleIds.includes(styleId)
                    ? await this.prisma.category_styles.count({
                          where: { style_id: BigInt(styleId) },
                      })
                    : 0;

                const productsCount = stylesUsedInProducts.has(styleId)
                    ? allProducts.filter((product) => {
                          if (!product.style_ids) return false;
                          const styleIds = product.style_ids as number[];
                          return (
                              Array.isArray(styleIds) &&
                              styleIds.includes(styleId)
                          );
                      }).length
                    : 0;

                return {
                    id: styleId,
                    name: style?.name || 'Unknown',
                    categoriesCount,
                    productsCount,
                };
            }),
        );

        const conflicts: string[] = [];
        styleDetails.forEach((detail) => {
            if (detail.categoriesCount > 0 && detail.productsCount > 0) {
                conflicts.push(
                    `${detail.name} (assigned to ${detail.categoriesCount} categor(ies) and ${detail.productsCount} product(s))`,
                );
            } else if (detail.categoriesCount > 0) {
                conflicts.push(
                    `${detail.name} (assigned to ${detail.categoriesCount} categor(ies))`,
                );
            } else if (detail.productsCount > 0) {
                conflicts.push(
                    `${detail.name} (assigned to ${detail.productsCount} product(s))`,
                );
            }
        });

        if (deletedCount > 0) {
            // Partial success
            return {
                success: true,
                message: `${deletedCount} style${deletedCount === 1 ? '' : 's'} deleted successfully. Cannot delete: ${conflicts.join(', ')}. Please remove them from all categories and products first.`,
            };
        } else {
            // All failed
            throw new BadRequestException(
                `Cannot delete style(s): ${conflicts.join(', ')}. Please remove the style(s) from all categories and products first, then delete the style(s).`,
            );
        }
    }
}
