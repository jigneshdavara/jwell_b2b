import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondShapeSizeDto,
    UpdateDiamondShapeSizeDto,
} from './dto/diamond-shape-size.dto';

@Injectable()
export class DiamondShapeSizesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number, shapeId?: number) {
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
        await this.prisma.diamond_shape_sizes.create({
            data: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                diamond_shape_id: BigInt(dto.diamond_shape_id),
                size: dto.size,
                secondary_size: dto.secondary_size || null,
                description: dto.description || null,
                display_order: dto.display_order,
                ctw: dto.ctw,
            },
        });
        return {
            success: true,
            message: 'Diamond shape size created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondShapeSizeDto) {
        await this.findOne(id);
        await this.prisma.diamond_shape_sizes.update({
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
            },
        });
        return {
            success: true,
            message: 'Diamond shape size updated successfully',
        };
    }

    async remove(id: number) {
        await this.findOne(id);

        // Check if diamonds exist - if they do, prevent deletion
        const diamondsCount = await this.prisma.diamonds.count({
            where: { diamond_shape_size_id: BigInt(id) },
        });

        if (diamondsCount > 0) {
            throw new BadRequestException(
                'Cannot delete diamond shape size because it has associated diamonds. Please remove all diamonds first.',
            );
        }

        // If no diamonds exist, delete the shape size
        await this.prisma.diamond_shape_sizes.delete({
            where: { id: BigInt(id) },
        });
        return {
            success: true,
            message: 'Diamond shape size deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        let deletedCount = 0;
        let skippedCount = 0;

        for (const id of ids) {
            // Check if shape size exists
            const shapeSize = await this.prisma.diamond_shape_sizes.findUnique({
                where: { id: BigInt(id) },
            });

            if (!shapeSize) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            const diamondsCount = await this.prisma.diamonds.count({
                where: { diamond_shape_size_id: BigInt(id) },
            });

            if (diamondsCount > 0) {
                skippedCount++;
                continue;
            }

            // If no diamonds exist, delete the shape size
            await this.prisma.diamond_shape_sizes.delete({
                where: { id: BigInt(id) },
            });

            deletedCount++;
        }

        const messages: string[] = [];

        if (deletedCount > 0) {
            const plural = deletedCount === 1 ? '' : 's';
            messages.push(
                `${deletedCount} diamond shape size${plural} deleted successfully.`,
            );
        }

        if (skippedCount > 0) {
            messages.push(
                `${skippedCount} diamond shape size(s) could not be deleted because they have associated diamonds.`,
            );
        }

        if (messages.length === 0) {
            throw new BadRequestException(
                'No diamond shape sizes were deleted.',
            );
        }

        return {
            success: true,
            message: messages.join(' '),
        };
    }
}
