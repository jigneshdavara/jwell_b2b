import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondTypeDto,
    UpdateDiamondTypeDto,
} from './dto/diamond-type.dto';

@Injectable()
export class DiamondTypesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.diamond_types.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_types.count(),
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
        const item = await this.prisma.diamond_types.findUnique({
            where: { id: BigInt(id) },
        });
        if (!item) {
            throw new NotFoundException('Diamond type not found');
        }
        return item;
    }

    async create(dto: CreateDiamondTypeDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.diamond_types.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.diamond_types.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException(
                'Diamond type with this name already exists',
            );
        }
        if (existingByCode) {
            throw new ConflictException(
                'Diamond type with this code already exists',
            );
        }
        await this.prisma.diamond_types.create({
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
            message: 'Diamond type created successfully',
        };
    }

    async update(id: number, dto: UpdateDiamondTypeDto) {
        const existing = await this.findOne(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.diamond_types.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Diamond type with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.diamond_types.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Diamond type with this code already exists',
                );
            }
        }
        await this.prisma.diamond_types.update({
            where: { id: BigInt(id) },
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
            message: 'Diamond type updated successfully',
        };
    }

    async remove(id: number) {
        await this.findOne(id);

        // Check if diamonds exist - if they do, prevent deletion
        const diamondsCount = await this.prisma.diamonds.count({
            where: { diamond_type_id: BigInt(id) },
        });

        if (diamondsCount > 0) {
            throw new BadRequestException(
                'Cannot delete diamond type because it has associated diamonds. Please remove all diamonds first.',
            );
        }

        // If no diamonds exist, cascade delete all related data
        // Delete in order to respect foreign key constraints
        await this.prisma.diamond_shape_sizes.deleteMany({
            where: { diamond_type_id: BigInt(id) },
        });
        await this.prisma.diamond_shapes.deleteMany({
            where: { diamond_type_id: BigInt(id) },
        });
        await this.prisma.diamond_clarities.deleteMany({
            where: { diamond_type_id: BigInt(id) },
        });
        await this.prisma.diamond_colors.deleteMany({
            where: { diamond_type_id: BigInt(id) },
        });
        await this.prisma.diamond_types.delete({
            where: { id: BigInt(id) },
        });

        return { success: true, message: 'Diamond type deleted successfully' };
    }

    async bulkRemove(ids: number[]) {
        let deletedCount = 0;
        let skippedCount = 0;

        for (const id of ids) {
            // Check if type exists
            const type = await this.prisma.diamond_types.findUnique({
                where: { id: BigInt(id) },
            });

            if (!type) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            const diamondsCount = await this.prisma.diamonds.count({
                where: { diamond_type_id: BigInt(id) },
            });

            if (diamondsCount > 0) {
                skippedCount++;
                continue;
            }

            // If no diamonds exist, cascade delete all related data
            await this.prisma.diamond_shape_sizes.deleteMany({
                where: { diamond_type_id: BigInt(id) },
            });
            await this.prisma.diamond_shapes.deleteMany({
                where: { diamond_type_id: BigInt(id) },
            });
            await this.prisma.diamond_clarities.deleteMany({
                where: { diamond_type_id: BigInt(id) },
            });
            await this.prisma.diamond_colors.deleteMany({
                where: { diamond_type_id: BigInt(id) },
            });
            await this.prisma.diamond_types.delete({
                where: { id: BigInt(id) },
            });

            deletedCount++;
        }

        const messages: string[] = [];

        if (deletedCount > 0) {
            messages.push(
                `${deletedCount} diamond type(s) and all related data deleted successfully.`,
            );
        }

        if (skippedCount > 0) {
            messages.push(
                `${skippedCount} diamond type(s) could not be deleted because they have associated diamonds.`,
            );
        }

        if (messages.length === 0) {
            throw new BadRequestException('No diamond types were deleted.');
        }

        return {
            success: true,
            message: messages.join(' '),
        };
    }
}
