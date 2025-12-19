import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateOrderStatusDto,
    UpdateOrderStatusDto,
    BulkDestroyOrderStatusesDto,
} from './dto/order-status.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderStatusesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 20) {
        const skip = (page - 1) * perPage;

        const [items, total] = await Promise.all([
            this.prisma.order_statuses.findMany({
                skip,
                take: perPage,
                orderBy: [{ position: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.order_statuses.count(),
        ]);

        return {
            items: items.map((status) => ({
                id: status.id.toString(),
                name: status.name,
                slug: status.slug,
                color: status.color,
                is_default: status.is_default,
                is_active: status.is_active,
                position: status.position,
                created_at: status.created_at,
                updated_at: status.updated_at,
            })),
            meta: {
                total,
                page,
                per_page: perPage,
                total_pages: Math.ceil(total / perPage),
            },
        };
    }

    async create(dto: CreateOrderStatusDto) {
        // Check if name already exists
        const existing = await this.prisma.order_statuses.findFirst({
            where: { name: dto.name },
        });

        if (existing) {
            throw new BadRequestException(
                'Order status with this name already exists',
            );
        }

        return this.prisma.$transaction(async (tx) => {
            // If setting as default, unset other defaults
            if (dto.is_default) {
                await tx.order_statuses.updateMany({
                    where: { is_default: true },
                    data: { is_default: false },
                });
            }

            const slug = await this.generateUniqueSlug(dto.name, null, tx);

            const status = await tx.order_statuses.create({
                data: {
                    name: dto.name,
                    slug,
                    color: dto.color ?? '#64748b',
                    is_default: dto.is_default ?? false,
                    is_active: dto.is_active ?? true,
                    position: dto.position ?? 0,
                },
            });

            return {
                id: status.id.toString(),
                name: status.name,
                slug: status.slug,
                color: status.color,
                is_default: status.is_default,
                is_active: status.is_active,
                position: status.position,
                created_at: status.created_at,
                updated_at: status.updated_at,
            };
        });
    }

    async update(id: bigint, dto: UpdateOrderStatusDto) {
        const status = await this.prisma.order_statuses.findUnique({
            where: { id },
        });

        if (!status) {
            throw new NotFoundException(`Order status with ID ${id} not found`);
        }

        return this.prisma.$transaction(async (tx) => {
            // If setting as default, unset other defaults
            if (dto.is_default) {
                await tx.order_statuses.updateMany({
                    where: {
                        is_default: true,
                        id: { not: id },
                    },
                    data: { is_default: false },
                });
            }

            // Generate new slug if name changed
            let slug = status.slug;
            if (dto.name && dto.name !== status.name) {
                slug = await this.generateUniqueSlug(dto.name, id, tx);
            }

            const updated = await tx.order_statuses.update({
                where: { id },
                data: {
                    name: dto.name ?? status.name,
                    slug,
                    color: dto.color ?? status.color,
                    is_default: dto.is_default ?? status.is_default,
                    is_active: dto.is_active ?? status.is_active,
                    position: dto.position ?? status.position,
                },
            });

            return {
                id: updated.id.toString(),
                name: updated.name,
                slug: updated.slug,
                color: updated.color,
                is_default: updated.is_default,
                is_active: updated.is_active,
                position: updated.position,
                created_at: updated.created_at,
                updated_at: updated.updated_at,
            };
        });
    }

    async remove(id: bigint) {
        const status = await this.prisma.order_statuses.findUnique({
            where: { id },
        });

        if (!status) {
            throw new NotFoundException(`Order status with ID ${id} not found`);
        }

        // Check if it's the default status and if there are other statuses
        if (status.is_default) {
            const otherStatuses = await this.prisma.order_statuses.findFirst({
                where: {
                    id: { not: id },
                },
            });

            if (otherStatuses) {
                throw new BadRequestException(
                    'You must designate another default status before deleting this one.',
                );
            }
        }

        await this.prisma.order_statuses.delete({
            where: { id },
        });

        return { message: 'Order status removed successfully' };
    }

    async bulkDestroy(dto: BulkDestroyOrderStatusesDto) {
        const ids = dto.ids.map((id) => BigInt(id));

        // Check if any of the statuses being deleted is the default
        const defaultStatuses = await this.prisma.order_statuses.findMany({
            where: {
                id: { in: ids },
                is_default: true,
            },
        });

        if (defaultStatuses.length > 0) {
            throw new BadRequestException(
                'Cannot delete the default status. Please assign another default first.',
            );
        }

        await this.prisma.order_statuses.deleteMany({
            where: {
                id: { in: ids },
            },
        });

        return { message: 'Selected order statuses deleted successfully' };
    }

    private async generateUniqueSlug(
        name: string,
        ignoreId: bigint | null,
        tx: Prisma.TransactionClient,
    ): Promise<string> {
        const base = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        let slug = base;
        let counter = 1;

        while (true) {
            const existing = await tx.order_statuses.findFirst({
                where: {
                    slug,
                    ...(ignoreId ? { id: { not: ignoreId } } : {}),
                },
            });

            if (!existing) {
                break;
            }

            slug = `${base}-${counter++}`;
        }

        return slug;
    }
}
