import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondShapeSizeDto,
    UpdateDiamondShapeSizeDto,
} from './dto/diamond-shape-size.dto';

@Injectable()
export class DiamondShapeSizesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number, shapeId?: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.diamond_shape_sizes.findMany({
                skip,
                take: perPage,
                where: shapeId
                    ? { diamond_shape_id: BigInt(shapeId) }
                    : undefined,
                include: {
                    diamond_types: {
                        select: { id: true, name: true, code: true },
                    },
                    diamond_shapes: {
                        select: { id: true, name: true, code: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { size: 'asc' }],
            }),
            this.prisma.diamond_shape_sizes.count({
                where: shapeId
                    ? { diamond_shape_id: BigInt(shapeId) }
                    : undefined,
            }),
        ]);

        // Map items to match frontend expectations (diamond_types -> type, diamond_shapes -> shape)
        const mappedItems = items.map((item) => {
            const { diamond_types, diamond_shapes, ...rest } = item;
            return {
                ...rest,
                type: diamond_types || null,
                shape: diamond_shapes || null,
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
        const item = await this.prisma.diamond_shape_sizes.findUnique({
            where: { id: BigInt(id) },
            include: {
                diamond_types: true,
                diamond_shapes: true,
            },
        });
        if (!item) {
            throw new NotFoundException('Diamond shape size not found');
        }
        return item;
    }

    async create(dto: CreateDiamondShapeSizeDto) {
        await this.prisma.diamond_shape_sizes.create({
            data: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                diamond_shape_id: BigInt(dto.diamond_shape_id),
                size: dto.size,
                secondary_size: dto.secondary_size || null,
                description: dto.description || null,
                display_order: dto.display_order,
                ctw: dto.ctw,
            },
        });
        return {
            success: true,
            message: 'Diamond shape size created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondShapeSizeDto) {
        await this.findOne(id);
        await this.prisma.diamond_shape_sizes.update({
            where: { id: BigInt(id) },
            data: {
                diamond_type_id: dto.diamond_type_id
                    ? BigInt(dto.diamond_type_id)
                    : undefined,
                diamond_shape_id: dto.diamond_shape_id
                    ? BigInt(dto.diamond_shape_id)
                    : undefined,
                size: dto.size,
                secondary_size: dto.secondary_size,
                description: dto.description,
                display_order: dto.display_order,
                ctw: dto.ctw,
            },
        });
        return {
            success: true,
            message: 'Diamond shape size updated successfully',
        };
    }

    async remove(id: number) {
        const shapeSizeId = BigInt(id);
        const shapeSize = await this.prisma.diamond_shape_sizes.findUnique({
            where: { id: shapeSizeId },
        });
        if (!shapeSize)
            throw new NotFoundException('Diamond shape size not found');

        // Find all diamonds with this diamond_shape_size_id
        const diamonds = await this.prisma.diamonds.findMany({
            where: {
                diamond_shape_size_id: shapeSizeId,
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
                    `Cannot delete this diamond shape size. It is currently assigned to ${productsCount} product(s). Please remove the diamond shape size from all products first, then delete the diamond shape size.`,
                );
            }
        }

        // If no products use this shape size, delete it
        await this.prisma.diamond_shape_sizes.delete({
            where: { id: shapeSizeId },
        });
        return {
            success: true,
            message: 'Diamond shape size deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const shapeSizesWithProducts: bigint[] = [];

        // Check all shape sizes for product assignments
        for (const id of ids) {
            const shapeSizeId = BigInt(id);
            const shapeSize = await this.prisma.diamond_shape_sizes.findUnique({
                where: { id: shapeSizeId },
            });

            if (!shapeSize) {
                continue;
            }

            // Find all diamonds with this diamond_shape_size_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_shape_size_id: shapeSizeId,
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
                    shapeSizesWithProducts.push(shapeSizeId);
                }
            }
        }

        if (shapeSizesWithProducts.length > 0) {
            const shapeSizeNames =
                await this.prisma.diamond_shape_sizes.findMany({
                    where: {
                        id: { in: shapeSizesWithProducts },
                    },
                    select: {
                        size: true,
                    },
                });
            const shapeSizeNamesList = shapeSizeNames
                .map((s) => s.size)
                .join(', ');
            throw new BadRequestException(
                `Cannot delete diamond shape size(s): ${shapeSizeNamesList}. They are currently assigned to products. Please remove the diamond shape size(s) from all products first, then delete the diamond shape size(s).`,
            );
        }

        let deletedCount = 0;

        for (const id of ids) {
            const shapeSizeId = BigInt(id);
            // Check if shape size exists
            const shapeSize = await this.prisma.diamond_shape_sizes.findUnique({
                where: { id: shapeSizeId },
            });

            if (!shapeSize) {
                continue;
            }

            // If no products use this shape size, delete it
            await this.prisma.diamond_shape_sizes.delete({
                where: { id: shapeSizeId },
            });

            deletedCount++;
        }

        return {
            success: true,
            message: `${deletedCount} diamond shape size${deletedCount === 1 ? '' : 's'} deleted successfully.`,
        };
    }
}
