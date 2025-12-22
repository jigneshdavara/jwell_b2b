import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateMetalPurityDto,
    UpdateMetalPurityDto,
} from './dto/metal-purity.dto';

@Injectable()
export class MetalPuritiesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
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
                metal: item.metals ? {
                    id: Number(item.metals.id),
                    name: item.metals.name,
                } : null,
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
            metal: purity.metals ? {
                id: Number(purity.metals.id),
                name: purity.metals.name,
            } : null,
        };
    }

    async create(dto: CreateMetalPurityDto) {
        const purity = await this.prisma.metal_purities.create({
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
            ...purity,
            id: Number(purity.id),
            metal_id: Number(purity.metal_id),
            metal: purity.metals ? {
                id: Number(purity.metals.id),
                name: purity.metals.name,
            } : null,
        };
    }

    async update(id: number, dto: UpdateMetalPurityDto) {
        const existing = await this.prisma.metal_purities.findUnique({
            where: { id: BigInt(id) },
        });
        if (!existing) {
            throw new NotFoundException('Metal purity not found');
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
            metal: purity.metals ? {
                id: Number(purity.metals.id),
                name: purity.metals.name,
            } : null,
        };
    }

    async remove(id: number) {
        await this.findOne(id);
        return await this.prisma.metal_purities.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.metal_purities.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }
}
