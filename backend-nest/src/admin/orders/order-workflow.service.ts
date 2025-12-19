import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from './dto/order.dto';

@Injectable()
export class OrderWorkflowService {
    constructor(private prisma: PrismaService) {}

    async transitionOrder(
        orderId: bigint,
        status: OrderStatus,
        meta: Record<string, any> = {},
        userId?: bigint,
        actorGuard: 'customer' | 'admin' = 'admin',
    ) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.orders.findUnique({
                where: { id: orderId },
            });

            if (!order) {
                throw new NotFoundException(
                    `Order with ID ${orderId} not found`,
                );
            }

            // Merge meta with existing status_meta
            const currentMeta =
                (order.status_meta as Record<string, any>) ?? {};
            const mergedMeta = { ...currentMeta, ...meta };

            // Update order status
            const updatedOrder = await tx.orders.update({
                where: { id: orderId },
                data: {
                    status: status,
                    status_meta: mergedMeta,
                },
            });

            // Create status history entry
            // user_id should only be set for customers, not admins
            // (order_status_histories.user_id references customers table, not users table)
            await tx.order_status_histories.create({
                data: {
                    order_id: orderId,
                    user_id:
                        actorGuard === 'customer' ? (userId ?? null) : null,
                    status: status,
                    meta: {
                        ...meta,
                        actor_guard: actorGuard,
                        actor_user_id: userId?.toString() ?? null,
                    },
                },
            });

            // TODO: Dispatch OrderStatusUpdated event if needed

            return updatedOrder;
        });
    }
}
