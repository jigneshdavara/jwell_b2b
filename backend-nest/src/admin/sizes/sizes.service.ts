import {
    ConflictException,
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSizeDto, UpdateSizeDto } from './dto/size.dto';

@Injectable()
export class SizesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.sizes.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.sizes.count(),
        ]);

        return {
            items: items.map((item) => ({
                ...item,
                id: Number(item.id),
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
        const size = await this.prisma.sizes.findUnique({
            where: { id: BigInt(id) },
        });
        if (!size) {
            throw new NotFoundException('Size not found');
        }
        return {
            ...size,
            id: Number(size.id),
        };
    }

    async create(dto: CreateSizeDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.sizes.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.sizes.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException('Size with this name already exists');
        }
        if (existingByCode) {
            throw new ConflictException('Size with this code already exists');
        }

        await this.prisma.sizes.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order ?? 0,
            },
        });
        return {
            success: true,
            message: 'Size created successfully',
        };
    }

    async update(id: number, dto: UpdateSizeDto) {
        const existing = await this.findOne(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.sizes.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Size with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.sizes.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Size with this code already exists',
                );
            }
        }

        await this.prisma.sizes.update({
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
            message: 'Size updated successfully',
        };
    }

    async remove(id: number) {
        const size = await this.findOne(id);

        // Check if size is associated with any categories or products
        const [categoryCount, variantCount] = await Promise.all([
            this.prisma.category_sizes.count({
                where: { size_id: size.id },
            }),
            this.prisma.product_variants.count({
                where: { size_id: size.id },
            }),
        ]);

        if (categoryCount > 0 || variantCount > 0) {
            throw new BadRequestException(
                'Cannot delete size because it is associated with categories or products.',
            );
        }

        await this.prisma.sizes.delete({
            where: { id: BigInt(id) },
        });
        return {
            success: true,
            message: 'Size deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        const [associatedCategories, associatedVariants] = await Promise.all([
            this.prisma.category_sizes.findMany({
                where: { size_id: { in: bigIntIds } },
                select: { size_id: true },
            }),
            this.prisma.product_variants.findMany({
                where: { size_id: { in: bigIntIds } },
                select: { size_id: true },
            }),
        ]);

        const associatedIds = new Set([
            ...associatedCategories.map((ac) => ac.size_id),
            ...associatedVariants.map((av) => av.size_id),
        ]);

        const deletableIds = bigIntIds.filter((id) => !associatedIds.has(id));

        await this.prisma.sizes.deleteMany({
            where: { id: { in: deletableIds } },
        });

        return {
            success: true,
            message: 'Sizes deleted successfully',
        };
    }
}
