import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondColorDto,
    UpdateDiamondColorDto,
} from './dto/diamond-color.dto';

@Injectable()
export class DiamondColorsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const whereClause = {
            // Only show colors from active diamond types
            diamond_types: {
                is_active: true,
            },
        };
        const [items, total] = await Promise.all([
            this.prisma.diamond_colors.findMany({
                where: whereClause,
                skip,
                take: perPage,
                include: {
                    diamond_types: {
                        select: { id: true, name: true, code: true, is_active: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_colors.count({ where: whereClause }),
        ]);

        const mappedItems = items.map((item) => {
            const { diamond_types, ...rest } = item;
            return {
                ...rest,
                type: diamond_types || null,
            };
        });

        return {
            items: mappedItems,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const item = await this.prisma.diamond_colors.findUnique({
            where: { id: BigInt(id) },
            include: {
                diamond_types: true,
            },
        });
        if (!item) {
            throw new NotFoundException('Diamond color not found');
        }
        return item;
    }

    async create(dto: CreateDiamondColorDto) {
        // Validate that diamond_type_id exists
        const diamondType = await this.prisma.diamond_types.findUnique({
            where: { id: BigInt(dto.diamond_type_id) },
        });

        if (!diamondType) {
            throw new BadRequestException(`Diamond type does not exist`);
        }

        // Check for duplicate code within the same diamond type
        if (dto.code) {
            const existingByCode = await this.prisma.diamond_colors.findFirst({
                where: {
                    diamond_type_id: BigInt(dto.diamond_type_id),
                    code: dto.code,
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond color with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type
        const existingByName = await this.prisma.diamond_colors.findFirst({
            where: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                name: dto.name,
            },
        });

        if (existingByName) {
            throw new ConflictException(
                `Diamond color with name "${dto.name}" already exists for this diamond type`,
            );
        }

        await this.prisma.diamond_colors.create({
            data: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                code: dto.code,
                name: dto.name,
                description: dto.description || null,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
            },
        });
        return {
            success: true,
            message: 'Diamond color created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondColorDto) {
        const existing = await this.findOne(id);
        const diamondTypeId =
            dto.diamond_type_id ?? Number(existing.diamond_type_id);

        // Validate that diamond_type_id exists if provided
        if (dto.diamond_type_id !== undefined) {
            const diamondType = await this.prisma.diamond_types.findUnique({
                where: { id: BigInt(dto.diamond_type_id) },
            });

            if (!diamondType) {
                throw new BadRequestException(`Diamond type does not exist`);
            }
        }

        // Check for duplicate code within the same diamond type (excluding current record)
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.diamond_colors.findFirst({
                where: {
                    diamond_type_id: BigInt(diamondTypeId),
                    code: dto.code,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond color with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type (excluding current record)
        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.diamond_colors.findFirst({
                where: {
                    diamond_type_id: BigInt(diamondTypeId),
                    name: dto.name,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByName) {
                throw new ConflictException(
                    `Diamond color with name "${dto.name}" already exists for this diamond type`,
                );
            }
        }

        // Check if trying to pause/deactivate diamond color that is assigned to diamonds
        if (dto.is_active === false && existing.is_active === true) {
            const colorId = BigInt(id);
            // Find all diamonds with this diamond_color_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_color_id: colorId,
                },
                select: {
                    id: true,
                },
            });

            if (diamonds.length > 0) {
                const diamondIds = diamonds.map((d) => d.id);
                // Check if any of these diamonds are used in product variants
                const productsCount =
                    await this.prisma.product_variant_diamonds.count({
                        where: {
                            diamond_id: { in: diamondIds },
                        },
                    });

                if (productsCount > 0) {
                    throw new BadRequestException(
                        `Cannot deactivate this diamond color. It is currently assigned to ${diamonds.length} diamond(s), and ${productsCount} of them are used in product variant(s). Please remove the diamond color from all products first, then deactivate the diamond color.`,
                    );
                }

                // Also prevent deactivation if color is assigned to any diamonds (even if not in products)
                throw new BadRequestException(
                    `Cannot deactivate this diamond color. It is currently assigned to ${diamonds.length} diamond(s). Please remove or update the diamond color from all diamonds first, then deactivate the diamond color.`,
                );
            }
        }

        await this.prisma.diamond_colors.update({
            where: { id: BigInt(id) },
            data: {
                diamond_type_id: dto.diamond_type_id
                    ? BigInt(dto.diamond_type_id)
                    : undefined,
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
            },
        });
        return {
            success: true,
            message: 'Diamond color updated successfully',
        };
    }

    async remove(id: number) {
        const colorId = BigInt(id);
        const color = await this.prisma.diamond_colors.findUnique({
            where: { id: colorId },
        });
        if (!color) throw new NotFoundException('Diamond color not found');

        // Find all diamonds with this diamond_color_id
        const diamonds = await this.prisma.diamonds.findMany({
            where: {
                diamond_color_id: colorId,
            },
            select: {
                id: true,
            },
        });

        if (diamonds.length > 0) {
            const diamondIds = diamonds.map((d) => d.id);
            // Check if any of these diamonds are used in product variants
            const productsCount =
                await this.prisma.product_variant_diamonds.count({
                    where: {
                        diamond_id: { in: diamondIds },
                    },
                });

            if (productsCount > 0) {
                throw new BadRequestException(
                    `Cannot delete this diamond color. It is currently assigned to ${diamonds.length} diamond(s), and ${productsCount} of them are used in product variant(s). Please remove the diamond color from all products first, then delete the diamond color.`,
                );
            }

            // Also prevent deletion if color is assigned to any diamonds (even if not in products)
            throw new BadRequestException(
                `Cannot delete this diamond color. It is currently assigned to ${diamonds.length} diamond(s). Please remove or update the diamond color from all diamonds first, then delete the diamond color.`,
            );
        }

        // If no diamonds use this color, delete it
        await this.prisma.diamond_colors.delete({
            where: { id: colorId },
        });
        return {
            success: true,
            message: 'Diamond color deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const colorsWithDiamonds: Array<{
            id: bigint;
            name: string;
            diamondCount: number;
            productCount: number;
        }> = [];

        // Check all colors for diamond and product assignments
        for (const id of ids) {
            const colorId = BigInt(id);
            const color = await this.prisma.diamond_colors.findUnique({
                where: { id: colorId },
            });

            if (!color) {
                continue;
            }

            // Find all diamonds with this diamond_color_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_color_id: colorId,
                },
                select: {
                    id: true,
                },
            });

            if (diamonds.length > 0) {
                const diamondIds = diamonds.map((d) => d.id);
                // Check if any of these diamonds are used in product variants
                const productsCount =
                    await this.prisma.product_variant_diamonds.count({
                        where: {
                            diamond_id: { in: diamondIds },
                        },
                    });

                // Prevent deletion if color is assigned to any diamonds (even if not in products)
                colorsWithDiamonds.push({
                    id: colorId,
                    name: color.name,
                    diamondCount: diamonds.length,
                    productCount: productsCount,
                });
            }
        }

        if (colorsWithDiamonds.length > 0) {
            const colorMessages = colorsWithDiamonds.map((c) => {
                if (c.productCount > 0) {
                    return `${c.name} (${c.diamondCount} diamond(s), ${c.productCount} in products)`;
                }
                return `${c.name} (${c.diamondCount} diamond(s))`;
            });
            const colorNamesList = colorMessages.join(', ');
            throw new BadRequestException(
                `Cannot delete diamond color(s): ${colorNamesList}. They are currently assigned to diamonds. Please remove or update the diamond color(s) from all diamonds first, then delete the diamond color(s).`,
            );
        }

        let deletedCount = 0;

        for (const id of ids) {
            const colorId = BigInt(id);
            // Check if color exists
            const color = await this.prisma.diamond_colors.findUnique({
                where: { id: colorId },
            });

            if (!color) {
                continue;
            }

            // If no products use this color, delete it
            await this.prisma.diamond_colors.delete({
                where: { id: colorId },
            });

            deletedCount++;
        }

        return {
            success: true,
            message: `${deletedCount} diamond color${deletedCount === 1 ? '' : 's'} deleted successfully.`,
        };
    }
}
