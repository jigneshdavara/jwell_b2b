import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondShapeSizeDto,
    UpdateDiamondShapeSizeDto,
} from './dto/diamond-shape-size.dto';

@Injectable()
export class DiamondShapeSizesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10, shapeId?: number) {
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
        const now = new Date();
        return await this.prisma.diamond_shape_sizes.create({
            data: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                diamond_shape_id: BigInt(dto.diamond_shape_id),
                size: dto.size,
                secondary_size: dto.secondary_size || null,
                description: dto.description || null,
                display_order: dto.display_order,
                ctw: dto.ctw,
                created_at: now,
                updated_at: now,
            },
        });
    }

    async update(id: number, dto: UpdateDiamondShapeSizeDto) {
        await this.findOne(id);
        return await this.prisma.diamond_shape_sizes.update({
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
                updated_at: new Date(),
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return await this.prisma.diamond_shape_sizes.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.diamond_shape_sizes.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }
}
