import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondColorDto,
    UpdateDiamondColorDto,
} from './dto/diamond-color.dto';

@Injectable()
export class DiamondColorsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.diamond_colors.findMany({
                skip,
                take: perPage,
                include: {
                    diamond_types: {
                        select: { id: true, name: true, code: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_colors.count(),
        ]);

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
        const item = await this.prisma.diamond_colors.findUnique({
            where: { id: BigInt(id) },
            include: {
                diamond_types: true,
            },
        });
        if (!item) {
            throw new NotFoundException('Diamond color not found');
        }
        return item;
    }

    async create(dto: CreateDiamondColorDto) {
        // Validate that diamond_type_id exists
        const diamondType = await this.prisma.diamond_types.findUnique({
            where: { id: BigInt(dto.diamond_type_id) },
        });

        if (!diamondType) {
            throw new BadRequestException(`Diamond type does not exist`);
        }

        // Check for duplicate code within the same diamond type
        if (dto.code) {
            const existingByCode = await this.prisma.diamond_colors.findFirst({
                where: {
                    diamond_type_id: BigInt(dto.diamond_type_id),
                    code: dto.code,
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond color with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type
        const existingByName = await this.prisma.diamond_colors.findFirst({
            where: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                name: dto.name,
            },
        });

        if (existingByName) {
            throw new ConflictException(
                `Diamond color with name "${dto.name}" already exists for this diamond type`,
            );
        }

        await this.prisma.diamond_colors.create({
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
            message: 'Diamond color created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondColorDto) {
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
            const existingByCode = await this.prisma.diamond_colors.findFirst({
                where: {
                    diamond_type_id: BigInt(diamondTypeId),
                    code: dto.code,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByCode) {
                throw new ConflictException(
                    `Diamond color with code "${dto.code}" already exists for this diamond type`,
                );
            }
        }

        // Check for duplicate name within the same diamond type (excluding current record)
        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.diamond_colors.findFirst({
                where: {
                    diamond_type_id: BigInt(diamondTypeId),
                    name: dto.name,
                    id: { not: BigInt(id) },
                },
            });

            if (existingByName) {
                throw new ConflictException(
                    `Diamond color with name "${dto.name}" already exists for this diamond type`,
                );
            }
        }

        await this.prisma.diamond_colors.update({
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
            message: 'Diamond color updated successfully',
        };
    }

    async remove(id: number) {
        await this.findOne(id);

        // Check if diamonds exist - if they do, prevent deletion
        const diamondsCount = await this.prisma.diamonds.count({
            where: { diamond_color_id: BigInt(id) },
        });

        if (diamondsCount > 0) {
            throw new BadRequestException(
                'Cannot delete diamond color because it has associated diamonds. Please remove all diamonds first.',
            );
        }

        // If no diamonds exist, delete the color
        await this.prisma.diamond_colors.delete({
            where: { id: BigInt(id) },
        });
        return {
            success: true,
            message: 'Diamond color deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        let deletedCount = 0;
        let skippedCount = 0;

        for (const id of ids) {
            // Check if color exists
            const color = await this.prisma.diamond_colors.findUnique({
                where: { id: BigInt(id) },
            });

            if (!color) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            const diamondsCount = await this.prisma.diamonds.count({
                where: { diamond_color_id: BigInt(id) },
            });

            if (diamondsCount > 0) {
                skippedCount++;
                continue;
            }

            // If no diamonds exist, delete the color
            await this.prisma.diamond_colors.delete({
                where: { id: BigInt(id) },
            });

            deletedCount++;
        }

        const messages: string[] = [];

        if (deletedCount > 0) {
            const plural = deletedCount === 1 ? '' : 's';
            messages.push(
                `${deletedCount} diamond color${plural} deleted successfully.`,
            );
        }

        if (skippedCount > 0) {
            const plural = skippedCount === 1 ? '' : 's';
            const verb = skippedCount === 1 ? 'it has' : 'they have';
            messages.push(
                `${skippedCount} diamond color${plural} could not be deleted because ${verb} associated diamonds.`,
            );
        }

        if (messages.length === 0) {
            throw new BadRequestException('No diamond colors were deleted.');
        }

        return {
            success: true,
            message: messages.join(' '),
        };
    }
}
