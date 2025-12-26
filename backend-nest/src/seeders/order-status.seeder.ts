import { BaseSeeder } from './base-seeder';

export class OrderStatusSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const statuses = [
            {
                name: 'Pending Payment',
                code: 'pending_payment',
                color: '#f59e0b',
                is_default: true,
                display_order: 1,
            },
            {
                name: 'Pending',
                code: 'pending',
                color: '#f59e0b',
                is_default: false,
                display_order: 2,
            },
            {
                name: 'Approved',
                code: 'approved',
                color: '#10b981',
                is_default: false,
                display_order: 3,
            },
            {
                name: 'In Production',
                code: 'in_production',
                color: '#3b82f6',
                is_default: false,
                display_order: 4,
            },
            {
                name: 'Quality Check',
                code: 'quality_check',
                color: '#8b5cf6',
                is_default: false,
                display_order: 5,
            },
            {
                name: 'Ready to Dispatch',
                code: 'ready_to_dispatch',
                color: '#06b6d4',
                is_default: false,
                display_order: 6,
            },
            {
                name: 'Dispatched',
                code: 'dispatched',
                color: '#6366f1',
                is_default: false,
                display_order: 7,
            },
            {
                name: 'Delivered',
                code: 'delivered',
                color: '#10b981',
                is_default: false,
                display_order: 8,
            },
            {
                name: 'Cancelled',
                code: 'cancelled',
                color: '#ef4444',
                is_default: false,
                display_order: 9,
            },
            {
                name: 'Payment Failed',
                code: 'payment_failed',
                color: '#ef4444',
                is_default: false,
                display_order: 10,
            },
        ];

        for (const status of statuses) {
            await this.prisma.order_statuses.upsert({
                where: { code: status.code },
                update: {
                    name: status.name,
                    color: status.color,
                    is_default: status.is_default,
                    is_active: true,
                    display_order: status.display_order,
                },
                create: {
                    name: status.name,
                    code: status.code,
                    color: status.color,
                    is_default: status.is_default,
                    is_active: true,
                    display_order: status.display_order,
                },
            });
        }

        this.log(`Seeded ${statuses.length} order statuses`);
    }
}
