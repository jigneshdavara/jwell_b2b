import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStyleDto, UpdateStyleDto } from './dto/style.dto';

@Injectable()
export class StylesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
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
        const style = await this.prisma.styles.findUnique({
            where: { id: BigInt(id) },
        });
        if (!style) {
            throw new NotFoundException('Style not found');
        }
        return {
            ...style,
            id: Number(style.id),
        };
    }

    async create(dto: CreateStyleDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.styles.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.styles.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException('Style with this name already exists');
        }
        if (existingByCode) {
            throw new ConflictException('Style with this code already exists');
        }

        await this.prisma.styles.create({
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
            message: 'Style created successfully',
        };
    }

    async update(id: number, dto: UpdateStyleDto) {
        const existing = await this.findOne(id);
        const styleId = BigInt(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.styles.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Style with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.styles.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Style with this code already exists',
                );
            }
        }

        // Check if trying to pause/deactivate style that is assigned to products
        if (dto.is_active === false && existing.is_active === true) {
            // Get all products and filter those with style_ids containing this style
            const allProducts = await this.prisma.products.findMany({
                select: {
                    id: true,
                    style_ids: true,
                },
            });

            // Filter products where this style ID is in the style_ids array
            const styleIdNumber = Number(id);
            const matchingProducts = allProducts.filter((product) => {
                if (!product.style_ids) return false;
                const styleIds = product.style_ids as number[];
                return (
                    Array.isArray(styleIds) && styleIds.includes(styleIdNumber)
                );
            });

            if (matchingProducts.length > 0) {
                throw new BadRequestException(
                    `Cannot pause this style. It is currently assigned to ${matchingProducts.length} product(s). Please remove the style from all products first, then pause the style.`,
                );
            }
        }

        await this.prisma.styles.update({
            where: { id: styleId },
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
            message: 'Style updated successfully',
        };
    }

    async remove(id: number) {
        const styleId = BigInt(id);
        const style = await this.prisma.styles.findUnique({
            where: { id: styleId },
        });
        if (!style) throw new NotFoundException('Style not found');

        // Check if style is assigned to products (in style_ids JSON array)
        // Get all products and filter those with style_ids containing this style
        const allProducts = await this.prisma.products.findMany({
            select: {
                id: true,
                style_ids: true,
            },
        });

        // Filter products where this style ID is in the style_ids array
        const styleIdNumber = Number(id);
        const matchingProducts = allProducts.filter((product) => {
            if (!product.style_ids) return false;
            const styleIds = product.style_ids as number[];
            return Array.isArray(styleIds) && styleIds.includes(styleIdNumber);
        });

        if (matchingProducts.length > 0) {
            throw new BadRequestException(
                `Cannot delete this style. It is currently assigned to ${matchingProducts.length} product(s). Please remove the style from all products first, then delete the style.`,
            );
        }

        await this.prisma.styles.delete({
            where: { id: styleId },
        });
        return {
            success: true,
            message: 'Style deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Check if any of the styles are assigned to products (in style_ids JSON array)
        // Get all products and filter those with style_ids containing any of the selected styles
        const allProducts = await this.prisma.products.findMany({
            select: {
                id: true,
                style_ids: true,
            },
        });

        // Find which style IDs from the delete list are in style_ids
        const styleIdsAsNumbers = ids.map((id) => Number(id));
        const stylesUsedInProducts = new Set<number>();

        allProducts.forEach((product) => {
            if (!product.style_ids) return;
            const styleIds = product.style_ids as number[];
            if (Array.isArray(styleIds)) {
                styleIds.forEach((styleId) => {
                    if (styleIdsAsNumbers.includes(styleId)) {
                        stylesUsedInProducts.add(styleId);
                    }
                });
            }
        });

        if (stylesUsedInProducts.size > 0) {
            const styleNames = await this.prisma.styles.findMany({
                where: {
                    id: {
                        in: Array.from(stylesUsedInProducts).map((id) =>
                            BigInt(id),
                        ),
                    },
                },
                select: {
                    name: true,
                },
            });
            const styleNamesList = styleNames.map((s) => s.name).join(', ');
            throw new BadRequestException(
                `Cannot delete style(s): ${styleNamesList}. They are currently assigned to products. Please remove the style(s) from all products first, then delete the style(s).`,
            );
        }

        await this.prisma.styles.deleteMany({
            where: { id: { in: bigIntIds } },
        });

        return {
            success: true,
            message: 'Styles deleted successfully',
        };
    }
}
