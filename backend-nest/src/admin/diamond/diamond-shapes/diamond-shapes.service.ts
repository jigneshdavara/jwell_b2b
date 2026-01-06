import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondShapeDto,
    UpdateDiamondShapeDto,
} from './dto/diamond-shape.dto';

@Injectable()
export class DiamondShapesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number, activeOnly: boolean = false) {
        const skip = (page - 1) * perPage;
        const whereClause: any = {
            // Only show shapes from active diamond types
            diamond_types: {
                is_active: true,
            },
        };
        // Add shape active filter if requested
        if (activeOnly) {
            whereClause.is_active = true;
        }
        const [items, total] = await Promise.all([
            this.prisma.diamond_shapes.findMany({
                where: whereClause,
                skip,
                take: perPage,
                include: {
                    diamond_types: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            is_active: true,
                        },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_shapes.count({ where: whereClause }),
        ]);

        // Map items to match frontend expectations (diamond_types -> type)
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
        const item = await this.prisma.diamond_shapes.findUnique({
            where: { id: BigInt(id) },
            include: {
                diamond_types: true,
            },
        });
        if (!item) {
            throw new NotFoundException('Diamond shape not found');
        }
        return item;
    }

    async create(dto: CreateDiamondShapeDto) {
        // Validate that diamond_type_id exists
        const diamondType = await this.prisma.diamond_types.findUnique({
            where: { id: BigInt(dto.diamond_type_id) },
        });

        if (!diamondType) {
            throw new BadRequestException(`Diamond type does not exist`);
        }

        // Check for duplicate code within the same diamond type
        if (dto.code) {
            const existingByCode = await this.prisma.diamond_shapes.findFirst({
                where: {
                    diamond_type_id: BigInt(dto.diamond_type_id),
                    code: dto.code,
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond shape with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type
        const existingByName = await this.prisma.diamond_shapes.findFirst({
            where: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                name: dto.name,
            },
        });

        if (existingByName) {
            throw new ConflictException(
                `Diamond shape with name "${dto.name}" already exists for this diamond type`,
            );
        }

        await this.prisma.diamond_shapes.create({
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
            message: 'Diamond shape created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondShapeDto) {
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
            const existingByCode = await this.prisma.diamond_shapes.findFirst({
                where: {
                    diamond_type_id: BigInt(diamondTypeId),
                    code: dto.code,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond shape with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type (excluding current record)
        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.diamond_shapes.findFirst({
                where: {
                    diamond_type_id: BigInt(diamondTypeId),
                    name: dto.name,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByName) {
                throw new ConflictException(
                    `Diamond shape with name "${dto.name}" already exists for this diamond type`,
                );
            }
        }

        // Check if trying to pause/deactivate diamond shape that is assigned to shape sizes or products
        if (dto.is_active === false && existing.is_active === true) {
            const shapeId = BigInt(id);

            // Check if shape sizes exist - if they do, prevent pausing
            const shapeSizesCount = await this.prisma.diamond_shape_sizes.count(
                {
                    where: { diamond_shape_id: shapeId },
                },
            );

            if (shapeSizesCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this diamond shape. It has ${shapeSizesCount} associated shape size(s). Please remove all shape sizes first, then pause the diamond shape.`,
                );
            }

            // Find all diamonds with this diamond_shape_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_shape_id: shapeId,
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
                        `Cannot deactivate this diamond shape. It is currently assigned to ${diamonds.length} diamond(s), and ${productsCount} of them are used in product variant(s). Please remove the diamond shape from all products first, then deactivate the diamond shape.`,
                    );
                }

                // Also prevent deactivation if shape is assigned to any diamonds (even if not in products)
                throw new BadRequestException(
                    `Cannot deactivate this diamond shape. It is currently assigned to ${diamonds.length} diamond(s). Please remove or update the diamond shape from all diamonds first, then deactivate the diamond shape.`,
                );
            }
        }

        await this.prisma.diamond_shapes.update({
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
            message: 'Diamond shape updated successfully',
        };
    }

    async remove(id: number) {
        const shapeId = BigInt(id);
        const shape = await this.prisma.diamond_shapes.findUnique({
            where: { id: shapeId },
        });
        if (!shape) throw new NotFoundException('Diamond shape not found');

        // Check if shape sizes exist - if they do, prevent deletion
        const shapeSizesCount = await this.prisma.diamond_shape_sizes.count({
            where: { diamond_shape_id: shapeId },
        });

        if (shapeSizesCount > 0) {
            throw new BadRequestException(
                `Cannot delete this diamond shape. It has ${shapeSizesCount} associated shape size(s). Please remove all shape sizes first, then delete the diamond shape.`,
            );
        }

        // Find all diamonds with this diamond_shape_id
        const diamonds = await this.prisma.diamonds.findMany({
            where: {
                diamond_shape_id: shapeId,
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
                    `Cannot delete this diamond shape. It is currently assigned to ${diamonds.length} diamond(s), and ${productsCount} of them are used in product variant(s). Please remove the diamond shape from all products first, then delete the diamond shape.`,
                );
            }

            // Also prevent deletion if shape is assigned to any diamonds (even if not in products)
            throw new BadRequestException(
                `Cannot delete this diamond shape. It is currently assigned to ${diamonds.length} diamond(s). Please remove or update the diamond shape from all diamonds first, then delete the diamond shape.`,
            );
        }

        // If no diamonds or shape sizes use this shape, delete it
        await this.prisma.diamond_shapes.delete({
            where: { id: shapeId },
        });
        return {
            success: true,
            message: 'Diamond shape deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const shapesWithShapeSizes: Array<{
            id: bigint;
            name: string;
            count: number;
        }> = [];
        const shapesWithDiamonds: Array<{
            id: bigint;
            name: string;
            diamondCount: number;
            productCount: number;
        }> = [];

        // Check all shapes for shape sizes and diamond/product assignments
        for (const id of ids) {
            const shapeId = BigInt(id);
            const shape = await this.prisma.diamond_shapes.findUnique({
                where: { id: shapeId },
            });

            if (!shape) {
                continue;
            }

            // Check if shape sizes exist - if they do, prevent deletion
            const shapeSizesCount = await this.prisma.diamond_shape_sizes.count(
                {
                    where: { diamond_shape_id: shapeId },
                },
            );

            if (shapeSizesCount > 0) {
                shapesWithShapeSizes.push({
                    id: shapeId,
                    name: shape.name,
                    count: shapeSizesCount,
                });
                continue; // Skip diamond check if shape sizes exist
            }

            // Find all diamonds with this diamond_shape_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_shape_id: shapeId,
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

                // Prevent deletion if shape is assigned to any diamonds (even if not in products)
                shapesWithDiamonds.push({
                    id: shapeId,
                    name: shape.name,
                    diamondCount: diamonds.length,
                    productCount: productsCount,
                });
            }
        }

        // Check shape sizes first (higher priority error)
        if (shapesWithShapeSizes.length > 0) {
            const shapeMessages = shapesWithShapeSizes.map(
                (s) => `${s.name} (${s.count} shape size(s))`,
            );
            const shapeNamesList = shapeMessages.join(', ');
            throw new BadRequestException(
                `Cannot delete diamond shape(s): ${shapeNamesList}. They have associated shape sizes. Please remove all shape sizes first, then delete the diamond shape(s).`,
            );
        }

        if (shapesWithDiamonds.length > 0) {
            const shapeMessages = shapesWithDiamonds.map((s) => {
                if (s.productCount > 0) {
                    return `${s.name} (${s.diamondCount} diamond(s), ${s.productCount} in products)`;
                }
                return `${s.name} (${s.diamondCount} diamond(s))`;
            });
            const shapeNamesList = shapeMessages.join(', ');
            throw new BadRequestException(
                `Cannot delete diamond shape(s): ${shapeNamesList}. They are currently assigned to diamonds. Please remove or update the diamond shape(s) from all diamonds first, then delete the diamond shape(s).`,
            );
        }

        let deletedCount = 0;

        for (const id of ids) {
            const shapeId = BigInt(id);
            // Check if shape exists
            const shape = await this.prisma.diamond_shapes.findUnique({
                where: { id: shapeId },
            });

            if (!shape) {
                continue;
            }

            // Check if shape sizes exist - if they do, skip deletion (already validated above)
            const shapeSizesCount = await this.prisma.diamond_shape_sizes.count(
                {
                    where: { diamond_shape_id: shapeId },
                },
            );

            if (shapeSizesCount > 0) {
                continue;
            }

            // If no products or shape sizes use this shape, delete it
            await this.prisma.diamond_shapes.delete({
                where: { id: shapeId },
            });

            deletedCount++;
        }

        return {
            success: true,
            message: `${deletedCount} diamond shape${deletedCount === 1 ? '' : 's'} deleted successfully.`,
        };
    }
}
