import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';

@Injectable()
export class MetalsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number, activeOnly: boolean = false) {
        const skip = (page - 1) * perPage;
        const whereClause = activeOnly ? { is_active: true } : {};
        const [items, total] = await Promise.all([
            this.prisma.metals.findMany({
                where: whereClause,
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.metals.count({ where: whereClause }),
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
        const metal = await this.prisma.metals.findUnique({
            where: { id: BigInt(id) },
        });
        if (!metal) {
            throw new NotFoundException('Metal not found');
        }
        return metal;
    }

    async create(dto: CreateMetalDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.metals.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.metals.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException('Metal with this name already exists');
        }
        if (existingByCode) {
            throw new ConflictException('Metal with this code already exists');
        }

        await this.prisma.metals.create({
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
            message: 'Metal created successfully',
        };
    }

    async update(id: number, dto: UpdateMetalDto) {
        const existing = await this.findOne(id);
        const metalId = BigInt(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.metals.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Metal with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.metals.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Metal with this code already exists',
                );
            }
        }

        // Check if trying to pause/deactivate metal that is assigned to purities, tones, or products
        if (dto.is_active === false && existing.is_active === true) {
            const [puritiesCount, tonesCount, productsCount] =
                await Promise.all([
                    this.prisma.metal_purities.count({
                        where: {
                            metal_id: metalId,
                        },
                    }),
                    this.prisma.metal_tones.count({
                        where: {
                            metal_id: metalId,
                        },
                    }),
                    this.prisma.product_variant_metals.count({
                        where: {
                            metal_id: metalId,
                        },
                    }),
                ]);

            const conflicts: string[] = [];
            if (puritiesCount > 0) {
                conflicts.push(
                    `${puritiesCount} metal purit${puritiesCount === 1 ? 'y' : 'ies'}`,
                );
            }
            if (tonesCount > 0) {
                conflicts.push(
                    `${tonesCount} metal tone${tonesCount === 1 ? '' : 's'}`,
                );
            }
            if (productsCount > 0) {
                conflicts.push(
                    `${productsCount} product variant${productsCount === 1 ? '' : 's'}`,
                );
            }

            if (conflicts.length > 0) {
                throw new BadRequestException(
                    `Cannot pause this metal. It is currently assigned to: ${conflicts.join(', ')}. Please remove the metal from all related entities first, then pause the metal.`,
                );
            }
        }

        await this.prisma.metals.update({
            where: { id: metalId },
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
            message: 'Metal updated successfully',
        };
    }

    async remove(id: number) {
        const metalId = BigInt(id);
        const metal = await this.prisma.metals.findUnique({
            where: { id: metalId },
        });
        if (!metal) throw new NotFoundException('Metal not found');

        // Check if metal is assigned to purities, tones, or products
        const [puritiesCount, tonesCount, productsCount] = await Promise.all([
            this.prisma.metal_purities.count({
                where: {
                    metal_id: metalId,
                },
            }),
            this.prisma.metal_tones.count({
                where: {
                    metal_id: metalId,
                },
            }),
            this.prisma.product_variant_metals.count({
                where: {
                    metal_id: metalId,
                },
            }),
        ]);

        const conflicts: string[] = [];
        if (puritiesCount > 0) {
            conflicts.push(
                `${puritiesCount} metal purit${puritiesCount === 1 ? 'y' : 'ies'}`,
            );
        }
        if (tonesCount > 0) {
            conflicts.push(
                `${tonesCount} metal tone${tonesCount === 1 ? '' : 's'}`,
            );
        }
        if (productsCount > 0) {
            conflicts.push(
                `${productsCount} product variant${productsCount === 1 ? '' : 's'}`,
            );
        }

        if (conflicts.length > 0) {
            throw new BadRequestException(
                `Cannot delete this metal. It is currently assigned to: ${conflicts.join(', ')}. Please remove the metal from all related entities first, then delete the metal.`,
            );
        }

        await this.prisma.metals.delete({
            where: { id: metalId },
        });
        return {
            success: true,
            message: 'Metal deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Check if any of the metals are assigned to purities, tones, or products
        const [metalsWithPurities, metalsWithTones, metalsWithProducts] =
            await Promise.all([
                this.prisma.metal_purities.findMany({
                    where: {
                        metal_id: { in: bigIntIds },
                    },
                    select: {
                        metal_id: true,
                    },
                    distinct: ['metal_id'],
                }),
                this.prisma.metal_tones.findMany({
                    where: {
                        metal_id: { in: bigIntIds },
                    },
                    select: {
                        metal_id: true,
                    },
                    distinct: ['metal_id'],
                }),
                this.prisma.product_variant_metals.findMany({
                    where: {
                        metal_id: { in: bigIntIds },
                    },
                    select: {
                        metal_id: true,
                    },
                    distinct: ['metal_id'],
                }),
            ]);

        const purityMetalIds = metalsWithPurities
            .map((p) => p.metal_id)
            .filter((id): id is bigint => id !== null);
        const toneMetalIds = metalsWithTones
            .map((t) => t.metal_id)
            .filter((id): id is bigint => id !== null);
        const productMetalIds = metalsWithProducts
            .map((p) => p.metal_id)
            .filter((id): id is bigint => id !== null);

        const allConflictingMetalIds = [
            ...new Set([
                ...purityMetalIds,
                ...toneMetalIds,
                ...productMetalIds,
            ]),
        ];

        // Find IDs that can be deleted (not in conflicts)
        const deletableIds = bigIntIds.filter(
            (id) => !allConflictingMetalIds.includes(id),
        );

        // Delete only the items without conflicts
        let deletedCount = 0;
        if (deletableIds.length > 0) {
            const result = await this.prisma.metals.deleteMany({
                where: { id: { in: deletableIds } },
            });
            deletedCount = result.count;
        }

        // Build response message
        if (allConflictingMetalIds.length === 0) {
            // All items deleted successfully
            return {
                success: true,
                message: `${deletedCount} metal${deletedCount === 1 ? '' : 's'} deleted successfully`,
            };
        }

        // Get metal details with counts for conflicts
        const metalDetails = await Promise.all(
            allConflictingMetalIds.map(async (metalId) => {
                const metal = await this.prisma.metals.findUnique({
                    where: { id: metalId },
                    select: { name: true },
                });

                const puritiesCount = purityMetalIds.includes(metalId)
                    ? await this.prisma.metal_purities.count({
                          where: { metal_id: metalId },
                      })
                    : 0;

                const tonesCount = toneMetalIds.includes(metalId)
                    ? await this.prisma.metal_tones.count({
                          where: { metal_id: metalId },
                      })
                    : 0;

                const productsCount = productMetalIds.includes(metalId)
                    ? await this.prisma.product_variant_metals.count({
                          where: { metal_id: metalId },
                      })
                    : 0;

                return {
                    id: metalId,
                    name: metal?.name || 'Unknown',
                    puritiesCount,
                    tonesCount,
                    productsCount,
                };
            }),
        );

        const conflicts: string[] = [];
        metalDetails.forEach((detail) => {
            const detailConflicts: string[] = [];
            if (detail.puritiesCount > 0) {
                detailConflicts.push(
                    `${detail.puritiesCount} purit${detail.puritiesCount === 1 ? 'y' : 'ies'}`,
                );
            }
            if (detail.tonesCount > 0) {
                detailConflicts.push(
                    `${detail.tonesCount} tone${detail.tonesCount === 1 ? '' : 's'}`,
                );
            }
            if (detail.productsCount > 0) {
                detailConflicts.push(
                    `${detail.productsCount} product variant${detail.productsCount === 1 ? '' : 's'}`,
                );
            }

            if (detailConflicts.length > 0) {
                conflicts.push(
                    `${detail.name} (assigned to ${detailConflicts.join(', ')})`,
                );
            }
        });

        if (deletedCount > 0) {
            // Partial success
            return {
                success: true,
                message: `${deletedCount} metal${deletedCount === 1 ? '' : 's'} deleted successfully. Cannot delete: ${conflicts.join(', ')}. Please remove them from all related entities first.`,
            };
        } else {
            // All failed
            throw new BadRequestException(
                `Cannot delete metal(s): ${conflicts.join(', ')}. Please remove the metal(s) from all related entities first, then delete the metal(s).`,
            );
        }
    }
}
