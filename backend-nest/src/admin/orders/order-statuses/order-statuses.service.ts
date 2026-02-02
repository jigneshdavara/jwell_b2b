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

@Injectable()
export class OrderStatusesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
        const skip = (page - 1) * perPage;

        const [items, total] = await Promise.all([
            this.prisma.order_statuses.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.order_statuses.count(),
        ]);

        return {
            items: items.map((status) => ({
                id: status.id.toString(),
                name: status.name,
                code: status.code,
                color: status.color,
                is_default: status.is_default,
                is_active: status.is_active,
                display_order: status.display_order,
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
        const existingName = await this.prisma.order_statuses.findFirst({
            where: { name: dto.name },
        });

        if (existingName) {
            throw new BadRequestException(
                'Order status with this name already exists',
            );
        }

        // Check if code already exists
        const existingCode = await this.prisma.order_statuses.findFirst({
            where: { code: dto.code },
        });

        if (existingCode) {
            throw new BadRequestException(
                'Order status with this code already exists',
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

            const status = await tx.order_statuses.create({
                data: {
                    name: dto.name,
                    code: dto.code,
                    color: dto.color ?? '#64748b',
                    is_default: dto.is_default ?? false,
                    is_active: dto.is_active ?? true,
                    display_order: dto.display_order ?? 0,
                },
            });

            return {
                id: status.id.toString(),
                name: status.name,
                code: status.code,
                color: status.color,
                is_default: status.is_default,
                is_active: status.is_active,
                display_order: status.display_order,
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

            // Check if code is being changed and if it already exists
            if (dto.code && dto.code !== status.code) {
                const existingCode = await tx.order_statuses.findFirst({
                    where: {
                        code: dto.code,
                        id: { not: id },
                    },
                });

                if (existingCode) {
                    throw new BadRequestException(
                        'Order status with this code already exists',
                    );
                }
            }

            const updated = await tx.order_statuses.update({
                where: { id },
                data: {
                    name: dto.name ?? status.name,
                    code: dto.code ?? status.code,
                    color: dto.color ?? status.color,
                    is_default: dto.is_default ?? status.is_default,
                    is_active: dto.is_active ?? status.is_active,
                    display_order: dto.display_order ?? status.display_order,
                },
            });

            return {
                id: updated.id.toString(),
                name: updated.name,
                code: updated.code,
                color: updated.color,
                is_default: updated.is_default,
                is_active: updated.is_active,
                display_order: updated.display_order,
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
}
