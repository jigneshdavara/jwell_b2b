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
        await this.findOne(id);
        return await this.prisma.metal_tones.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.metal_tones.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }
}
