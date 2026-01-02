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

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.diamond_types.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_types.count(),
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

        // Check if trying to pause/deactivate diamond type that is assigned to products
        if (dto.is_active === false && existing.is_active === true) {
            const typeId = BigInt(id);
            // Find all diamonds with this diamond_type_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_type_id: typeId,
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
                        `Cannot pause this diamond type. It is currently assigned to ${productsCount} product(s). Please remove the diamond type from all products first, then pause the diamond type.`,
                    );
                }
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

        // Find all diamonds with this diamond_type_id
        const diamonds = await this.prisma.diamonds.findMany({
            where: {
                diamond_type_id: typeId,
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
                    `Cannot delete this diamond type. It is currently assigned to ${productsCount} product(s). Please remove the diamond type from all products first, then delete the diamond type.`,
                );
            }
        }

        // If no products use this type, cascade delete all related data
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
        const typesWithProducts: bigint[] = [];

        // Check all types for product assignments
        for (const id of ids) {
            const typeId = BigInt(id);
            const type = await this.prisma.diamond_types.findUnique({
                where: { id: typeId },
            });

            if (!type) {
                continue;
            }

            // Find all diamonds with this diamond_type_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_type_id: typeId,
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
                    typesWithProducts.push(typeId);
                }
            }
        }

        if (typesWithProducts.length > 0) {
            const typeNames = await this.prisma.diamond_types.findMany({
                where: {
                    id: { in: typesWithProducts },
                },
                select: {
                    name: true,
                },
            });
            const typeNamesList = typeNames.map((t) => t.name).join(', ');
            throw new BadRequestException(
                `Cannot delete diamond type(s): ${typeNamesList}. They are currently assigned to products. Please remove the diamond type(s) from all products first, then delete the diamond type(s).`,
            );
        }

        let deletedCount = 0;

        for (const id of ids) {
            const typeId = BigInt(id);
            // Check if type exists
            const type = await this.prisma.diamond_types.findUnique({
                where: { id: typeId },
            });

            if (!type) {
                continue;
            }

            // If no products use this type, cascade delete all related data
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

            deletedCount++;
        }

        return {
            success: true,
            message: `${deletedCount} diamond type(s) and all related data deleted successfully.`,
        };
    }
}
