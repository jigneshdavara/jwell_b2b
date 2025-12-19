import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStyleDto, UpdateStyleDto } from './dto/style.dto';

@Injectable()
export class StylesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.styles.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.styles.count(),
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
        const style = await this.prisma.styles.findUnique({
            where: { id: BigInt(id) },
        });
        if (!style) {
            throw new NotFoundException('Style not found');
        }
        return style;
    }

    async create(dto: CreateStyleDto) {
        return await this.prisma.styles.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order ?? 0,
            },
        });
    }

    async update(id: number, dto: UpdateStyleDto) {
        await this.findOne(id);
        return await this.prisma.styles.update({
            where: { id: BigInt(id) },
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
            },
        });
    }

    async remove(id: number) {
        const style = await this.findOne(id);

        // Check if style is associated with any categories
        const count = await this.prisma.category_styles.count({
            where: { style_id: style.id },
        });

        if (count > 0) {
            throw new BadRequestException(
                'Cannot delete style because it is associated with one or more categories.',
            );
        }

        return await this.prisma.styles.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // In NestJS, we can perform checks before bulk deletion
        const associatedStyles = await this.prisma.category_styles.findMany({
            where: { style_id: { in: bigIntIds } },
            select: { style_id: true },
        });

        const associatedIds = new Set(
            associatedStyles.map((as) => as.style_id),
        );
        const deletableIds = bigIntIds.filter((id) => !associatedIds.has(id));

        const result = await this.prisma.styles.deleteMany({
            where: { id: { in: deletableIds } },
        });

        return {
            deletedCount: result.count,
            skippedCount: bigIntIds.length - deletableIds.length,
        };
    }
}
