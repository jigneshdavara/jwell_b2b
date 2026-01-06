import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondTypeDto,
    UpdateDiamondTypeDto,
} from './dto/diamond-type.dto';

@Injectable()
export class DiamondTypesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number, activeOnly: boolean = false) {
        const skip = (page - 1) * perPage;
        const whereClause = activeOnly ? { is_active: true } : {};
        const [items, total] = await Promise.all([
            this.prisma.diamond_types.findMany({
                where: whereClause,
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_types.count({ where: whereClause }),
        ]);

        return {
            items,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const item = await this.prisma.diamond_types.findUnique({
            where: { id: BigInt(id) },
        });
        if (!item) {
            throw new NotFoundException('Diamond type not found');
        }
        return item;
    }

    async create(dto: CreateDiamondTypeDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.diamond_types.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.diamond_types.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException(
                'Diamond type with this name already exists',
            );
        }
        if (existingByCode) {
            throw new ConflictException(
                'Diamond type with this code already exists',
            );
        }
        await this.prisma.diamond_types.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
            },
        });
        return {
            success: true,
            message: 'Diamond type created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondTypeDto) {
        const existing = await this.findOne(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.diamond_types.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Diamond type with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.diamond_types.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Diamond type with this code already exists',
                );
            }
        }

        // Check if trying to pause/deactivate diamond type that is assigned to diamonds, clarities, colors, shapes, or shape sizes
        if (dto.is_active === false && existing.is_active === true) {
            const typeId = BigInt(id);

            // Check all relationships in parallel
            const [
                diamonds,
                claritiesCount,
                colorsCount,
                shapesCount,
                shapeSizesCount,
            ] = await Promise.all([
                this.prisma.diamonds.findMany({
                    where: { diamond_type_id: typeId },
                    select: { id: true },
                }),
                this.prisma.diamond_clarities.count({
                    where: { diamond_type_id: typeId },
                }),
                this.prisma.diamond_colors.count({
                    where: { diamond_type_id: typeId },
                }),
                this.prisma.diamond_shapes.count({
                    where: { diamond_type_id: typeId },
                }),
                this.prisma.diamond_shape_sizes.count({
                    where: { diamond_type_id: typeId },
                }),
            ]);

            // Build conflict messages
            const conflicts: string[] = [];
            if (diamonds.length > 0)
                conflicts.push(`${diamonds.length} diamond(s)`);
            if (claritiesCount > 0)
                conflicts.push(
                    `${claritiesCount} clarit${claritiesCount === 1 ? 'y' : 'ies'}`,
                );
            if (colorsCount > 0)
                conflicts.push(
                    `${colorsCount} color${colorsCount === 1 ? '' : 's'}`,
                );
            if (shapesCount > 0)
                conflicts.push(
                    `${shapesCount} shape${shapesCount === 1 ? '' : 's'}`,
                );
            if (shapeSizesCount > 0)
                conflicts.push(
                    `${shapeSizesCount} shape size${shapeSizesCount === 1 ? '' : 's'}`,
                );

            if (conflicts.length > 0) {
                // Check if any diamonds are used in products
                if (diamonds.length > 0) {
                    const diamondIds = diamonds.map((d) => d.id);
                    const productsCount =
                        await this.prisma.product_variant_diamonds.count({
                            where: { diamond_id: { in: diamondIds } },
                        });

                    if (productsCount > 0) {
                        throw new BadRequestException(
                            `Cannot deactivate this diamond type. It is currently assigned to ${conflicts.join(', ')}, and ${productsCount} diamond(s) are used in product variant(s). Please remove the diamond type from all products first, then deactivate the diamond type.`,
                        );
                    }
                }

                // Also prevent deactivation if type is assigned to any related records
                throw new BadRequestException(
                    `Cannot deactivate this diamond type. It is currently assigned to ${conflicts.join(', ')}. Please remove or update the diamond type from all related records first, then deactivate the diamond type.`,
                );
            }
        }

        await this.prisma.diamond_types.update({
            where: { id: BigInt(id) },
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
            message: 'Diamond type updated successfully',
        };
    }

    async remove(id: number) {
        const typeId = BigInt(id);
        const type = await this.prisma.diamond_types.findUnique({
            where: { id: typeId },
        });
        if (!type) throw new NotFoundException('Diamond type not found');

        // Check all relationships in parallel
        const [
            diamonds,
            claritiesCount,
            colorsCount,
            shapesCount,
            shapeSizesCount,
        ] = await Promise.all([
            this.prisma.diamonds.findMany({
                where: { diamond_type_id: typeId },
                select: { id: true },
            }),
            this.prisma.diamond_clarities.count({
                where: { diamond_type_id: typeId },
            }),
            this.prisma.diamond_colors.count({
                where: { diamond_type_id: typeId },
            }),
            this.prisma.diamond_shapes.count({
                where: { diamond_type_id: typeId },
            }),
            this.prisma.diamond_shape_sizes.count({
                where: { diamond_type_id: typeId },
            }),
        ]);

        // Build conflict messages
        const conflicts: string[] = [];
        if (diamonds.length > 0)
            conflicts.push(`${diamonds.length} diamond(s)`);
        if (claritiesCount > 0)
            conflicts.push(
                `${claritiesCount} clarit${claritiesCount === 1 ? 'y' : 'ies'}`,
            );
        if (colorsCount > 0)
            conflicts.push(
                `${colorsCount} color${colorsCount === 1 ? '' : 's'}`,
            );
        if (shapesCount > 0)
            conflicts.push(
                `${shapesCount} shape${shapesCount === 1 ? '' : 's'}`,
            );
        if (shapeSizesCount > 0)
            conflicts.push(
                `${shapeSizesCount} shape size${shapeSizesCount === 1 ? '' : 's'}`,
            );

        if (conflicts.length > 0) {
            // Check if any diamonds are used in products
            if (diamonds.length > 0) {
                const diamondIds = diamonds.map((d) => d.id);
                const productsCount =
                    await this.prisma.product_variant_diamonds.count({
                        where: { diamond_id: { in: diamondIds } },
                    });

                if (productsCount > 0) {
                    throw new BadRequestException(
                        `Cannot delete this diamond type. It is currently assigned to ${conflicts.join(', ')}, and ${productsCount} diamond(s) are used in product variant(s). Please remove the diamond type from all products first, then delete the diamond type.`,
                    );
                }
            }

            // Also prevent deletion if type is assigned to any related records
            throw new BadRequestException(
                `Cannot delete this diamond type. It is currently assigned to ${conflicts.join(', ')}. Please remove or update the diamond type from all related records first, then delete the diamond type.`,
            );
        }

        // If no related records use this type, cascade delete all related data
        // Delete in order to respect foreign key constraints
        await this.prisma.diamond_shape_sizes.deleteMany({
            where: { diamond_type_id: typeId },
        });
        await this.prisma.diamond_shapes.deleteMany({
            where: { diamond_type_id: typeId },
        });
        await this.prisma.diamond_clarities.deleteMany({
            where: { diamond_type_id: typeId },
        });
        await this.prisma.diamond_colors.deleteMany({
            where: { diamond_type_id: typeId },
        });
        await this.prisma.diamond_types.delete({
            where: { id: typeId },
        });

        return { success: true, message: 'Diamond type deleted successfully' };
    }

    async bulkRemove(ids: number[]) {
        const typesWithConflicts: Array<{
            id: bigint;
            name: string;
            conflicts: string[];
            diamondCount: number;
            productCount: number;
        }> = [];

        // Check all types for related records and product assignments
        for (const id of ids) {
            const typeId = BigInt(id);
            const type = await this.prisma.diamond_types.findUnique({
                where: { id: typeId },
            });

            if (!type) {
                continue;
            }

            // Check all relationships in parallel
            const [
                diamonds,
                claritiesCount,
                colorsCount,
                shapesCount,
                shapeSizesCount,
            ] = await Promise.all([
                this.prisma.diamonds.findMany({
                    where: { diamond_type_id: typeId },
                    select: { id: true },
                }),
                this.prisma.diamond_clarities.count({
                    where: { diamond_type_id: typeId },
                }),
                this.prisma.diamond_colors.count({
                    where: { diamond_type_id: typeId },
                }),
                this.prisma.diamond_shapes.count({
                    where: { diamond_type_id: typeId },
                }),
                this.prisma.diamond_shape_sizes.count({
                    where: { diamond_type_id: typeId },
                }),
            ]);

            // Build conflict messages
            const conflicts: string[] = [];
            if (diamonds.length > 0)
                conflicts.push(`${diamonds.length} diamond(s)`);
            if (claritiesCount > 0)
                conflicts.push(
                    `${claritiesCount} clarit${claritiesCount === 1 ? 'y' : 'ies'}`,
                );
            if (colorsCount > 0)
                conflicts.push(
                    `${colorsCount} color${colorsCount === 1 ? '' : 's'}`,
                );
            if (shapesCount > 0)
                conflicts.push(
                    `${shapesCount} shape${shapesCount === 1 ? '' : 's'}`,
                );
            if (shapeSizesCount > 0)
                conflicts.push(
                    `${shapeSizesCount} shape size${shapeSizesCount === 1 ? '' : 's'}`,
                );

            if (conflicts.length > 0) {
                // Check if any diamonds are used in products
                let productsCount = 0;
                if (diamonds.length > 0) {
                    const diamondIds = diamonds.map((d) => d.id);
                    productsCount =
                        await this.prisma.product_variant_diamonds.count({
                            where: { diamond_id: { in: diamondIds } },
                        });
                }

                // Prevent deletion if type is assigned to any related records
                typesWithConflicts.push({
                    id: typeId,
                    name: type.name,
                    conflicts,
                    diamondCount: diamonds.length,
                    productCount: productsCount,
                });
            }
        }

        // Find IDs that can be deleted (not in conflicts)
        const bigIntIds = ids.map((id) => BigInt(id));
        const conflictingIds = typesWithConflicts.map((t) => t.id);
        const deletableIds = bigIntIds.filter(
            (id) => !conflictingIds.includes(id),
        );

        // Delete only the items without conflicts (with cascade)
        let deletedCount = 0;
        if (deletableIds.length > 0) {
            // Cascade delete all related data for deletable types
            for (const typeId of deletableIds) {
                await this.prisma.diamond_shape_sizes.deleteMany({
                    where: { diamond_type_id: typeId },
                });
                await this.prisma.diamond_shapes.deleteMany({
                    where: { diamond_type_id: typeId },
                });
                await this.prisma.diamond_clarities.deleteMany({
                    where: { diamond_type_id: typeId },
                });
                await this.prisma.diamond_colors.deleteMany({
                    where: { diamond_type_id: typeId },
                });
            }
            const result = await this.prisma.diamond_types.deleteMany({
                where: { id: { in: deletableIds } },
            });
            deletedCount = result.count;
        }

        // Build response message
        if (typesWithConflicts.length === 0) {
            // All items deleted successfully
            return {
                success: true,
                message: `${deletedCount} diamond type(s) and all related data deleted successfully`,
            };
        }

        const typeMessages = typesWithConflicts.map((t) => {
            const conflictsStr = t.conflicts.join(', ');
            if (t.productCount > 0) {
                return `${t.name} (${conflictsStr}, ${t.productCount} in products)`;
            }
            return `${t.name} (${conflictsStr})`;
        });
        const typeNamesList = typeMessages.join(', ');

        if (deletedCount > 0) {
            // Partial success
            return {
                success: true,
                message: `${deletedCount} diamond type(s) and all related data deleted successfully. Cannot delete: ${typeNamesList}. They are currently assigned to related records. Please remove or update them from all related records first.`,
            };
        } else {
            // All failed
            throw new BadRequestException(
                `Cannot delete diamond type(s): ${typeNamesList}. They are currently assigned to related records. Please remove or update the diamond type(s) from all related records first, then delete the diamond type(s).`,
            );
        }
    }
}
