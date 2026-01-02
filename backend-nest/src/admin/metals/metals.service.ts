import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';

@Injectable()
export class MetalsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.metals.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.metals.count(),
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
        const metal = await this.prisma.metals.findUnique({
            where: { id: BigInt(id) },
        });
        if (!metal) {
            throw new NotFoundException('Metal not found');
        }
        return metal;
    }

    async create(dto: CreateMetalDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.metals.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.metals.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException('Metal with this name already exists');
        }
        if (existingByCode) {
            throw new ConflictException('Metal with this code already exists');
        }

        await this.prisma.metals.create({
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
            message: 'Metal created successfully',
        };
    }

    async update(id: number, dto: UpdateMetalDto) {
        const existing = await this.findOne(id);
        const metalId = BigInt(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.metals.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Metal with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.metals.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Metal with this code already exists',
                );
            }
        }

        // Check if trying to pause/deactivate metal that is assigned to products
        if (dto.is_active === false && existing.is_active === true) {
            const productsCount =
                await this.prisma.product_variant_metals.count({
                    where: {
                        metal_id: metalId,
                    },
                });

            if (productsCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this metal. It is currently assigned to ${productsCount} product(s). Please remove the metal from all products first, then pause the metal.`,
                );
            }
        }

        await this.prisma.metals.update({
            where: { id: metalId },
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
            message: 'Metal updated successfully',
        };
    }

    async remove(id: number) {
        const metalId = BigInt(id);
        const metal = await this.prisma.metals.findUnique({
            where: { id: metalId },
        });
        if (!metal) throw new NotFoundException('Metal not found');

        // Check if metal is assigned to products
        const productsCount = await this.prisma.product_variant_metals.count({
            where: {
                metal_id: metalId,
            },
        });

        if (productsCount > 0) {
            throw new BadRequestException(
                `Cannot delete this metal. It is currently assigned to ${productsCount} product(s). Please remove the metal from all products first, then delete the metal.`,
            );
        }

        await this.prisma.metals.delete({
            where: { id: metalId },
        });
        return {
            success: true,
            message: 'Metal deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Check if any of the metals are assigned to products
        const metalsWithProducts =
            await this.prisma.product_variant_metals.findMany({
                where: {
                    metal_id: { in: bigIntIds },
                },
                select: {
                    metal_id: true,
                },
                distinct: ['metal_id'],
            });

        if (metalsWithProducts.length > 0) {
            const metalNames = await this.prisma.metals.findMany({
                where: {
                    id: {
                        in: metalsWithProducts.map((p) => p.metal_id),
                    },
                },
                select: {
                    name: true,
                },
            });
            const metalNamesList = metalNames.map((m) => m.name).join(', ');
            throw new BadRequestException(
                `Cannot delete metal(s): ${metalNamesList}. They are currently assigned to products. Please remove the metal(s) from all products first, then delete the metal(s).`,
            );
        }

        await this.prisma.metals.deleteMany({
            where: { id: { in: bigIntIds } },
        });
        return {
            success: true,
            message: 'Metals deleted successfully',
        };
    }
}
