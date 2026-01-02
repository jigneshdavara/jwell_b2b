import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateMetalPurityDto,
    UpdateMetalPurityDto,
} from './dto/metal-purity.dto';

@Injectable()
export class MetalPuritiesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.metal_purities.findMany({
                skip,
                take: perPage,
                include: {
                    metals: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.metal_purities.count(),
        ]);

        return {
            items: items.map((item) => ({
                ...item,
                id: Number(item.id),
                metal_id: Number(item.metal_id),
                metal: item.metals
                    ? {
                          id: Number(item.metals.id),
                          name: item.metals.name,
                      }
                    : null,
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
        const purity = await this.prisma.metal_purities.findUnique({
            where: { id: BigInt(id) },
            include: {
                metals: true,
            },
        });
        if (!purity) {
            throw new NotFoundException('Metal purity not found');
        }
        return {
            ...purity,
            id: Number(purity.id),
            metal_id: Number(purity.metal_id),
            metal: purity.metals
                ? {
                      id: Number(purity.metals.id),
                      name: purity.metals.name,
                  }
                : null,
        };
    }

    async create(dto: CreateMetalPurityDto) {
        // Validate that metal_id exists
        const metal = await this.prisma.metals.findUnique({
            where: { id: BigInt(dto.metal_id) },
        });

        if (!metal) {
            throw new BadRequestException(`Metal does not exist`);
        }

        // Check for duplicate code within the same metal
        if (dto.code) {
            const existingByCode = await this.prisma.metal_purities.findFirst({
                where: {
                    metal_id: BigInt(dto.metal_id),
                    code: dto.code,
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Metal purity with code "${dto.code}" already exists for this metal`,
                );
            }
        }

        // Check for duplicate name within the same metal
        const existingByName = await this.prisma.metal_purities.findFirst({
            where: {
                metal_id: BigInt(dto.metal_id),
                name: dto.name,
            },
        });

        if (existingByName) {
            throw new ConflictException(
                `Metal purity with name "${dto.name}" already exists for this metal`,
            );
        }

        await this.prisma.metal_purities.create({
            data: {
                metal_id: BigInt(dto.metal_id),
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
            },
            include: {
                metals: {
                    select: { id: true, name: true },
                },
            },
        });
        return {
            success: true,
            message: 'Metal purity created successfully',
        };
    }

    async update(id: number, dto: UpdateMetalPurityDto) {
        const existing = await this.prisma.metal_purities.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) {
            throw new NotFoundException('Metal purity not found');
        }

        const metalId = dto.metal_id ?? Number(existing.metal_id);

        // Validate that metal_id exists if provided
        if (dto.metal_id !== undefined) {
            const metal = await this.prisma.metals.findUnique({
                where: { id: BigInt(dto.metal_id) },
            });

            if (!metal) {
                throw new BadRequestException(`Metal does not exist`);
            }
        }

        // Check for duplicate code within the same metal (excluding current record)
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.metal_purities.findFirst({
                where: {
                    metal_id: BigInt(metalId),
                    code: dto.code,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Metal purity with code "${dto.code}" already exists for this metal`,
                );
            }
        }

        // Check for duplicate name within the same metal (excluding current record)
        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.metal_purities.findFirst({
                where: {
                    metal_id: BigInt(metalId),
                    name: dto.name,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByName) {
                throw new ConflictException(
                    `Metal purity with name "${dto.name}" already exists for this metal`,
                );
            }
        }

        // Check if trying to pause/deactivate metal purity that is assigned to products
        if (dto.is_active === false && existing.is_active === true) {
            const purityId = BigInt(id);
            const productsCount =
                await this.prisma.product_variant_metals.count({
                    where: {
                        metal_purity_id: purityId,
                    },
                });

            if (productsCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this metal purity. It is currently assigned to ${productsCount} product(s). Please remove the metal purity from all products first, then pause the metal purity.`,
                );
            }
        }

        const purity = await this.prisma.metal_purities.update({
            where: { id: BigInt(id) },
            data: {
                metal_id: dto.metal_id ? BigInt(dto.metal_id) : undefined,
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
            },
            include: {
                metals: {
                    select: { id: true, name: true },
                },
            },
        });
        return {
            ...purity,
            id: Number(purity.id),
            metal_id: Number(purity.metal_id),
            metal: purity.metals
                ? {
                      id: Number(purity.metals.id),
                      name: purity.metals.name,
                  }
                : null,
        };
    }

    async remove(id: number) {
        const purityId = BigInt(id);
        const purity = await this.prisma.metal_purities.findUnique({
            where: { id: purityId },
        });
        if (!purity) throw new NotFoundException('Metal purity not found');

        // Check if metal purity is assigned to products
        const productsCount = await this.prisma.product_variant_metals.count({
            where: {
                metal_purity_id: purityId,
            },
        });

        if (productsCount > 0) {
            throw new BadRequestException(
                `Cannot delete this metal purity. It is currently assigned to ${productsCount} product(s). Please remove the metal purity from all products first, then delete the metal purity.`,
            );
        }

        await this.prisma.metal_purities.delete({
            where: { id: purityId },
        });
        return {
            success: true,
            message: 'Metal purity deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Check if any of the metal purities are assigned to products
        const puritiesWithProducts =
            await this.prisma.product_variant_metals.findMany({
                where: {
                    metal_purity_id: { in: bigIntIds },
                },
                select: {
                    metal_purity_id: true,
                },
                distinct: ['metal_purity_id'],
            });

        if (puritiesWithProducts.length > 0) {
            const purityIds = puritiesWithProducts
                .map((p) => p.metal_purity_id)
                .filter((id): id is bigint => id !== null);
            const purityNames = await this.prisma.metal_purities.findMany({
                where: {
                    id: {
                        in: purityIds,
                    },
                },
                select: {
                    name: true,
                },
            });
            const purityNamesList = purityNames.map((p) => p.name).join(', ');
            throw new BadRequestException(
                `Cannot delete metal purity(ies): ${purityNamesList}. They are currently assigned to products. Please remove the metal purity(ies) from all products first, then delete the metal purity(ies).`,
            );
        }

        await this.prisma.metal_purities.deleteMany({
            where: { id: { in: bigIntIds } },
        });
        return {
            success: true,
            message: 'Metal purities deleted successfully',
        };
    }
}
