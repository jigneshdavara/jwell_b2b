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
        const sizeId = BigInt(id);

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

        // Check if trying to pause/deactivate size that is assigned to products
        if (dto.is_active === false && existing.is_active === true) {
            const productsCount = await this.prisma.product_variants.count({
                where: {
                    size_id: sizeId,
                },
            });

            if (productsCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this size. It is currently assigned to ${productsCount} product(s). Please remove the size from all products first, then pause the size.`,
                );
            }
        }

        await this.prisma.sizes.update({
            where: { id: sizeId },
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
        const sizeId = BigInt(id);
        const size = await this.prisma.sizes.findUnique({
            where: { id: sizeId },
        });
        if (!size) throw new NotFoundException('Size not found');

        // Check if size is assigned to products
        const productsCount = await this.prisma.product_variants.count({
            where: {
                size_id: sizeId,
            },
        });

        if (productsCount > 0) {
            throw new BadRequestException(
                `Cannot delete this size. It is currently assigned to ${productsCount} product(s). Please remove the size from all products first, then delete the size.`,
            );
        }

        await this.prisma.sizes.delete({
            where: { id: sizeId },
        });
        return {
            success: true,
            message: 'Size deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Check if any of the sizes are assigned to products
        const sizesWithProducts = await this.prisma.product_variants.findMany({
            where: {
                size_id: { in: bigIntIds },
            },
            select: {
                size_id: true,
            },
            distinct: ['size_id'],
        });

        if (sizesWithProducts.length > 0) {
            const sizeIds = sizesWithProducts
                .map((p) => p.size_id)
                .filter((id): id is bigint => id !== null);
            const sizeNames = await this.prisma.sizes.findMany({
                where: {
                    id: {
                        in: sizeIds,
                    },
                },
                select: {
                    name: true,
                },
            });
            const sizeNamesList = sizeNames.map((s) => s.name).join(', ');
            throw new BadRequestException(
                `Cannot delete size(s): ${sizeNamesList}. They are currently assigned to products. Please remove the size(s) from all products first, then delete the size(s).`,
            );
        }

        await this.prisma.sizes.deleteMany({
            where: { id: { in: bigIntIds } },
        });

        return {
            success: true,
            message: 'Sizes deleted successfully',
        };
    }
}
