import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondShapeDto,
    UpdateDiamondShapeDto,
} from './dto/diamond-shape.dto';

@Injectable()
export class DiamondShapesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.diamond_shapes.findMany({
                skip,
                take: perPage,
                include: {
                    diamond_types: {
                        select: { id: true, name: true, code: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_shapes.count(),
        ]);

        // Map items to match frontend expectations (diamond_types -> type)
        const mappedItems = items.map((item) => {
            const { diamond_types, ...rest } = item;
            return {
                ...rest,
                type: diamond_types || null,
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
        const item = await this.prisma.diamond_shapes.findUnique({
            where: { id: BigInt(id) },
            include: {
                diamond_types: true,
            },
        });
        if (!item) {
            throw new NotFoundException('Diamond shape not found');
        }
        return item;
    }

    async create(dto: CreateDiamondShapeDto) {
        // Validate that diamond_type_id exists
        const diamondType = await this.prisma.diamond_types.findUnique({
            where: { id: BigInt(dto.diamond_type_id) },
        });

        if (!diamondType) {
            throw new BadRequestException(`Diamond type does not exist`);
        }

        // Check for duplicate code within the same diamond type
        if (dto.code) {
            const existingByCode = await this.prisma.diamond_shapes.findFirst({
                where: {
                    diamond_type_id: BigInt(dto.diamond_type_id),
                    code: dto.code,
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond shape with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type
        const existingByName = await this.prisma.diamond_shapes.findFirst({
            where: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                name: dto.name,
            },
        });

        if (existingByName) {
            throw new ConflictException(
                `Diamond shape with name "${dto.name}" already exists for this diamond type`,
            );
        }

        return await this.prisma.diamond_shapes.create({
            data: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                code: dto.code,
                name: dto.name,
                description: dto.description || null,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
            },
        });
        return {
            success: true,
            message: 'Diamond shape created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondShapeDto) {
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
            const existingByCode = await this.prisma.diamond_shapes.findFirst({
                where: {
                    diamond_type_id: BigInt(diamondTypeId),
                    code: dto.code,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond shape with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type (excluding current record)
        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.diamond_shapes.findFirst({
                where: {
                    diamond_type_id: BigInt(diamondTypeId),
                    name: dto.name,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByName) {
                throw new ConflictException(
                    `Diamond shape with name "${dto.name}" already exists for this diamond type`,
                );
            }
        }

        await this.prisma.diamond_shapes.update({
            where: { id: BigInt(id) },
            data: {
                diamond_type_id: dto.diamond_type_id
                    ? BigInt(dto.diamond_type_id)
                    : undefined,
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
            },
        });
        return {
            success: true,
            message: 'Diamond shape updated successfully',
        };
    }

    async remove(id: number) {
        await this.findOne(id);

        // Check if diamonds exist - if they do, prevent deletion
        const diamondsCount = await this.prisma.diamonds.count({
            where: { diamond_shape_id: BigInt(id) },
        });

        if (diamondsCount > 0) {
            throw new BadRequestException(
                'Cannot delete diamond shape because it has associated diamonds. Please remove all diamonds first.',
            );
        }

        // Check if shape sizes exist - if they do, prevent deletion
        const shapeSizesCount = await this.prisma.diamond_shape_sizes.count({
            where: { diamond_shape_id: BigInt(id) },
        });

        if (shapeSizesCount > 0) {
            throw new BadRequestException(
                'Cannot delete diamond shape because it has associated shape sizes. Please remove all shape sizes first.',
            );
        }

        // If no diamonds or shape sizes exist, delete the shape
        await this.prisma.diamond_shapes.delete({
            where: { id: BigInt(id) },
        });
        return {
            success: true,
            message: 'Diamond shape deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        let deletedCount = 0;
        let skippedCount = 0;

        for (const id of ids) {
            // Check if shape exists
            const shape = await this.prisma.diamond_shapes.findUnique({
                where: { id: BigInt(id) },
            });

            if (!shape) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            const diamondsCount = await this.prisma.diamonds.count({
                where: { diamond_shape_id: BigInt(id) },
            });

            if (diamondsCount > 0) {
                skippedCount++;
                continue;
            }

            // Check if shape sizes exist - if they do, skip deletion
            const shapeSizesCount = await this.prisma.diamond_shape_sizes.count(
                {
                    where: { diamond_shape_id: BigInt(id) },
                },
            );

            if (shapeSizesCount > 0) {
                skippedCount++;
                continue;
            }

            // If no diamonds or shape sizes exist, delete the shape
            await this.prisma.diamond_shapes.delete({
                where: { id: BigInt(id) },
            });

            deletedCount++;
        }

        const messages: string[] = [];

        if (deletedCount > 0) {
            messages.push(
                `${deletedCount} diamond shape(s) deleted successfully.`,
            );
        }

        if (skippedCount > 0) {
            messages.push(
                `${skippedCount} diamond shape(s) could not be deleted because they have associated diamonds or shape sizes.`,
            );
        }

        if (messages.length === 0) {
            throw new BadRequestException('No diamond shapes were deleted.');
        }

        return {
            success: true,
            message: messages.join(' '),
        };
    }
}
