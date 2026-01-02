import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMetalToneDto, UpdateMetalToneDto } from './dto/metal-tone.dto';

@Injectable()
export class MetalTonesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.metal_tones.findMany({
                skip,
                take: perPage,
                include: {
                    metals: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.metal_tones.count(),
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
        const tone = await this.prisma.metal_tones.findUnique({
            where: { id: BigInt(id) },
            include: {
                metals: true,
            },
        });
        if (!tone) {
            throw new NotFoundException('Metal tone not found');
        }
        return {
            ...tone,
            id: Number(tone.id),
            metal_id: Number(tone.metal_id),
            metal: tone.metals
                ? {
                      id: Number(tone.metals.id),
                      name: tone.metals.name,
                  }
                : null,
        };
    }

    async create(dto: CreateMetalToneDto) {
        // Validate that metal_id exists
        const metal = await this.prisma.metals.findUnique({
            where: { id: BigInt(dto.metal_id) },
        });

        if (!metal) {
            throw new BadRequestException(`Metal does not exist`);
        }

        // Check for duplicate code within the same metal
        if (dto.code) {
            const existingByCode = await this.prisma.metal_tones.findFirst({
                where: {
                    metal_id: BigInt(dto.metal_id),
                    code: dto.code,
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Metal tone with code "${dto.code}" already exists for this metal`,
                );
            }
        }

        // Check for duplicate name within the same metal
        const existingByName = await this.prisma.metal_tones.findFirst({
            where: {
                metal_id: BigInt(dto.metal_id),
                name: dto.name,
            },
        });

        if (existingByName) {
            throw new ConflictException(
                `Metal tone with name "${dto.name}" already exists for this metal`,
            );
        }

        await this.prisma.metal_tones.create({
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
            message: 'Metal tone created successfully',
        };
    }

    async update(id: number, dto: UpdateMetalToneDto) {
        const existing = await this.prisma.metal_tones.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) {
            throw new NotFoundException('Metal tone not found');
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
            const existingByCode = await this.prisma.metal_tones.findFirst({
                where: {
                    metal_id: BigInt(metalId),
                    code: dto.code,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Metal tone with code "${dto.code}" already exists for this metal`,
                );
            }
        }

        // Check for duplicate name within the same metal (excluding current record)
        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.metal_tones.findFirst({
                where: {
                    metal_id: BigInt(metalId),
                    name: dto.name,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByName) {
                throw new ConflictException(
                    `Metal tone with name "${dto.name}" already exists for this metal`,
                );
            }
        }

        // Check if trying to pause/deactivate metal tone that is assigned to products
        if (dto.is_active === false && existing.is_active === true) {
            const toneId = BigInt(id);
            const productsCount =
                await this.prisma.product_variant_metals.count({
                    where: {
                        metal_tone_id: toneId,
                    },
                });

            if (productsCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this metal tone. It is currently assigned to ${productsCount} product(s). Please remove the metal tone from all products first, then pause the metal tone.`,
                );
            }
        }

        await this.prisma.metal_tones.update({
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
            success: true,
            message: 'Metal tone updated successfully',
        };
    }

    async remove(id: number) {
        const toneId = BigInt(id);
        const tone = await this.prisma.metal_tones.findUnique({
            where: { id: toneId },
        });
        if (!tone) throw new NotFoundException('Metal tone not found');

        // Check if metal tone is assigned to products
        const productsCount = await this.prisma.product_variant_metals.count({
            where: {
                metal_tone_id: toneId,
            },
        });

        if (productsCount > 0) {
            throw new BadRequestException(
                `Cannot delete this metal tone. It is currently assigned to ${productsCount} product(s). Please remove the metal tone from all products first, then delete the metal tone.`,
            );
        }

        await this.prisma.metal_tones.delete({
            where: { id: toneId },
        });
        return {
            success: true,
            message: 'Metal tone deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Check if any of the metal tones are assigned to products
        const tonesWithProducts =
            await this.prisma.product_variant_metals.findMany({
                where: {
                    metal_tone_id: { in: bigIntIds },
                },
                select: {
                    metal_tone_id: true,
                },
                distinct: ['metal_tone_id'],
            });

        if (tonesWithProducts.length > 0) {
            const toneIds = tonesWithProducts
                .map((p) => p.metal_tone_id)
                .filter((id): id is bigint => id !== null);
            const toneNames = await this.prisma.metal_tones.findMany({
                where: {
                    id: {
                        in: toneIds,
                    },
                },
                select: {
                    name: true,
                },
            });
            const toneNamesList = toneNames.map((t) => t.name).join(', ');
            throw new BadRequestException(
                `Cannot delete metal tone(s): ${toneNamesList}. They are currently assigned to products. Please remove the metal tone(s) from all products first, then delete the metal tone(s).`,
            );
        }

        await this.prisma.metal_tones.deleteMany({
            where: { id: { in: bigIntIds } },
        });
        return {
            success: true,
            message: 'Metal tones deleted successfully',
        };
    }
}
