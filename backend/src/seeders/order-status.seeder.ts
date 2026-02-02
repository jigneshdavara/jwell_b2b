import { BaseSeeder } from './base-seeder';

export class OrderStatusSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const statuses = [
            {
                name: 'Pending Payment',
                code: 'pending_payment',
                color: '#F59E0B', // Amber
                is_default: true,
                display_order: 0,
            },
            {
                name: 'Pending',
                code: 'pending',
                color: '#F59E0B', // Amber
                is_default: false,
                display_order: 1,
            },
            {
                name: 'Payment Failed',
                code: 'payment_failed',
                color: '#EF4444', // Red/Rose
                is_default: false,
                display_order: 2,
            },
            {
                name: 'Approved',
                code: 'approved',
                color: '#10B981', // Emerald Green
                is_default: false,
                display_order: 3,
            },
            {
                name: 'Awaiting Materials',
                code: 'awaiting_materials',
                color: '#6366F1', // Indigo
                is_default: false,
                display_order: 4,
            },
            {
                name: 'In Production',
                code: 'in_production',
                color: '#6366F1', // Indigo
                is_default: false,
                display_order: 5,
            },
            {
                name: 'Quality Check',
                code: 'quality_check',
                color: '#3B82F6', // Blue
                is_default: false,
                display_order: 6,
            },
            {
                name: 'Ready to Dispatch',
                code: 'ready_to_dispatch',
                color: '#8B5CF6', // Purple
                is_default: false,
                display_order: 7,
            },
            {
                name: 'Dispatched',
                code: 'dispatched',
                color: '#0E244D', // Elvee Blue
                is_default: false,
                display_order: 8,
            },
            {
                name: 'Delivered',
                code: 'delivered',
                color: '#10B981', // Emerald Green
                is_default: false,
                display_order: 9,
            },
            {
                name: 'Cancelled',
                code: 'cancelled',
                color: '#EF4444', // Red/Rose
                is_default: false,
                display_order: 10,
            },
            {
                name: 'Paid',
                code: 'paid',
                color: '#10B981', // Emerald Green
                is_default: false,
                display_order: 11,
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
