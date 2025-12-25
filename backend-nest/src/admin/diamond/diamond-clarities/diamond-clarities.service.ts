import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateDiamondClarityDto,
    UpdateDiamondClarityDto,
} from './dto/diamond-clarity.dto';

@Injectable()
export class DiamondClaritiesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.diamond_clarities.findMany({
                skip,
                take: perPage,
                include: {
                    diamond_types: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.diamond_clarities.count(),
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
        const item = await this.prisma.diamond_clarities.findUnique({
            where: { id: BigInt(id) },
            include: {
                diamond_types: true,
            },
        });
        if (!item) {
            throw new NotFoundException('Diamond clarity not found');
        }
        return item;
    }

    async create(dto: CreateDiamondClarityDto) {
        const now = new Date();
        return await this.prisma.diamond_clarities.create({
            data: {
                diamond_type_id: BigInt(dto.diamond_type_id),
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
                created_at: now,
                updated_at: now,
            },
        });
    }

    async update(id: number, dto: UpdateDiamondClarityDto) {
        await this.findOne(id);
        return await this.prisma.diamond_clarities.update({
            where: { id: BigInt(id) },
            data: {
                diamond_type_id: dto.diamond_type_id
                    ? BigInt(dto.diamond_type_id)
                    : undefined,
                code: dto.code,
                name: dto.name,
                description: dto.description || null,
                is_active: dto.is_active,
                display_order: dto.display_order,
                updated_at: new Date(),
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);

        // Check if diamonds exist - if they do, prevent deletion
        const diamondsCount = await this.prisma.diamonds.count({
            where: { diamond_clarity_id: BigInt(id) },
        });

        if (diamondsCount > 0) {
            throw new BadRequestException(
                'Cannot delete diamond clarity because it has associated diamonds. Please remove all diamonds first.',
            );
        }

        // If no diamonds exist, delete the clarity
        return await this.prisma.diamond_clarities.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        let deletedCount = 0;
        let skippedCount = 0;

        for (const id of ids) {
            // Check if clarity exists
            const clarity = await this.prisma.diamond_clarities.findUnique({
                where: { id: BigInt(id) },
            });

            if (!clarity) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            const diamondsCount = await this.prisma.diamonds.count({
                where: { diamond_clarity_id: BigInt(id) },
            });

            if (diamondsCount > 0) {
                skippedCount++;
                continue;
            }

            // If no diamonds exist, delete the clarity
            await this.prisma.diamond_clarities.delete({
                where: { id: BigInt(id) },
            });

            deletedCount++;
        }

        const messages: string[] = [];

        if (deletedCount > 0) {
            const plural = deletedCount === 1 ? 'y' : 'ies';
            messages.push(
                `${deletedCount} diamond clarit${plural} deleted successfully.`,
            );
        }

        if (skippedCount > 0) {
            const plural = skippedCount === 1 ? 'y' : 'ies';
            const verb = skippedCount === 1 ? 'it has' : 'they have';
            messages.push(
                `${skippedCount} diamond clarit${plural} could not be deleted because ${verb} associated diamonds.`,
            );
        }

        if (messages.length === 0) {
            throw new BadRequestException('No diamond clarities were deleted.');
        }

        return {
            deletedCount,
            skippedCount,
            message: messages.join(' '),
        };
    }
}
