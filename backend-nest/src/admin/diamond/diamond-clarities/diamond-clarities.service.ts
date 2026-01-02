import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondClarityDto,
    UpdateDiamondClarityDto,
} from './dto/diamond-clarity.dto';

@Injectable()
export class DiamondClaritiesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.diamond_clarities.findMany({
                skip,
                take: perPage,
                include: {
                    diamond_types: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_clarities.count(),
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
        const item = await this.prisma.diamond_clarities.findUnique({
            where: { id: BigInt(id) },
            include: {
                diamond_types: true,
            },
        });
        if (!item) {
            throw new NotFoundException('Diamond clarity not found');
        }
        return item;
    }

    async create(dto: CreateDiamondClarityDto) {
        // Validate that diamond_type_id exists
        const diamondType = await this.prisma.diamond_types.findUnique({
            where: { id: BigInt(dto.diamond_type_id) },
        });

        if (!diamondType) {
            throw new BadRequestException(`Diamond type does not exist`);
        }

        // Check for duplicate code within the same diamond type
        if (dto.code) {
            const existingByCode =
                await this.prisma.diamond_clarities.findFirst({
                    where: {
                        diamond_type_id: BigInt(dto.diamond_type_id),
                        code: dto.code,
                    },
                });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond clarity with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type
        const existingByName = await this.prisma.diamond_clarities.findFirst({
            where: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                name: dto.name,
            },
        });

        if (existingByName) {
            throw new ConflictException(
                `Diamond clarity with name "${dto.name}" already exists for this diamond type`,
            );
        }

        await this.prisma.diamond_clarities.create({
            data: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
            },
        });

        return {
            success: true,
            message: 'Diamond clarity created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondClarityDto) {
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
            const existingByCode =
                await this.prisma.diamond_clarities.findFirst({
                    where: {
                        diamond_type_id: BigInt(diamondTypeId),
                        code: dto.code,
                        id: { not: BigInt(id) },
                    },
                });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond clarity with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type (excluding current record)
        if (dto.name && dto.name !== existing.name) {
            const existingByName =
                await this.prisma.diamond_clarities.findFirst({
                    where: {
                        diamond_type_id: BigInt(diamondTypeId),
                        name: dto.name,
                        id: { not: BigInt(id) },
                    },
                });

            if (existingByName) {
                throw new ConflictException(
                    `Diamond clarity with name "${dto.name}" already exists for this diamond type`,
                );
            }
        }

        // Check if trying to pause/deactivate diamond clarity that is assigned to products
        if (dto.is_active === false && existing.is_active === true) {
            const clarityId = BigInt(id);
            // Find all diamonds with this diamond_clarity_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_clarity_id: clarityId,
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
                        `Cannot pause this diamond clarity. It is currently assigned to ${productsCount} product(s). Please remove the diamond clarity from all products first, then pause the diamond clarity.`,
                    );
                }
            }
        }

        await this.prisma.diamond_clarities.update({
            where: { id: BigInt(id) },
            data: {
                diamond_type_id: dto.diamond_type_id
                    ? BigInt(dto.diamond_type_id)
                    : undefined,
                code: dto.code,
                name: dto.name,
                description: dto.description || null,
                is_active: dto.is_active,
                display_order: dto.display_order,
                updated_at: new Date(),
            },
        });

        return {
            success: true,
            message: 'Diamond clarity updated successfully',
        };
    }

    async remove(id: number) {
        const clarityId = BigInt(id);
        const clarity = await this.prisma.diamond_clarities.findUnique({
            where: { id: clarityId },
        });
        if (!clarity) throw new NotFoundException('Diamond clarity not found');

        // Find all diamonds with this diamond_clarity_id
        const diamonds = await this.prisma.diamonds.findMany({
            where: {
                diamond_clarity_id: clarityId,
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
                    `Cannot delete this diamond clarity. It is currently assigned to ${productsCount} product(s). Please remove the diamond clarity from all products first, then delete the diamond clarity.`,
                );
            }
        }

        // If no products use this clarity, delete it
        await this.prisma.diamond_clarities.delete({
            where: { id: clarityId },
        });
        return {
            success: true,
            message: 'Diamond clarity deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const claritiesWithProducts: bigint[] = [];

        // Check all clarities for product assignments
        for (const id of ids) {
            const clarityId = BigInt(id);
            const clarity = await this.prisma.diamond_clarities.findUnique({
                where: { id: clarityId },
            });

            if (!clarity) {
                continue;
            }

            // Find all diamonds with this diamond_clarity_id
            const diamonds = await this.prisma.diamonds.findMany({
                where: {
                    diamond_clarity_id: clarityId,
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
                    claritiesWithProducts.push(clarityId);
                }
            }
        }

        if (claritiesWithProducts.length > 0) {
            const clarityNames = await this.prisma.diamond_clarities.findMany({
                where: {
                    id: { in: claritiesWithProducts },
                },
                select: {
                    name: true,
                },
            });
            const clarityNamesList = clarityNames.map((c) => c.name).join(', ');
            throw new BadRequestException(
                `Cannot delete diamond clarity(ies): ${clarityNamesList}. They are currently assigned to products. Please remove the diamond clarity(ies) from all products first, then delete the diamond clarity(ies).`,
            );
        }

        let deletedCount = 0;

        for (const id of ids) {
            const clarityId = BigInt(id);
            // Check if clarity exists
            const clarity = await this.prisma.diamond_clarities.findUnique({
                where: { id: clarityId },
            });

            if (!clarity) {
                continue;
            }

            // If no products use this clarity, delete it
            await this.prisma.diamond_clarities.delete({
                where: { id: clarityId },
            });

            deletedCount++;
        }

        return {
            success: true,
            message: `${deletedCount} diamond clarit${deletedCount === 1 ? 'y' : 'ies'} deleted successfully.`,
        };
    }
}
