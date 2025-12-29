import { BaseSeeder } from './base-seeder';

export class OrderStatusSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const statuses = [
            {
                name: 'Pending',
                code: 'pending',
                color: '#f59e0b',
                is_default: true,
                display_order: 0,
            },
            {
                name: 'Processing',
                code: 'processing',
                color: '#3b82f6',
                is_default: false,
                display_order: 1,
            },
            {
                name: 'Shipped',
                code: 'shipped',
                color: '#0ea5e9',
                is_default: false,
                display_order: 2,
            },
            {
                name: 'Completed',
                code: 'completed',
                color: '#10b981',
                is_default: false,
                display_order: 3,
            },
            {
                name: 'Cancelled',
                code: 'cancelled',
                color: '#ef4444',
                is_default: false,
                display_order: 4,
            },
            {
                name: 'Awaiting materials',
                code: 'awaiting_materials',
                color: '#6366f1',
                is_default: false,
                display_order: 5,
            },
            {
                name: 'Under production',
                code: 'under_production',
                color: '#1d4ed8',
                is_default: false,
                display_order: 6,
            },
            {
                name: 'Pending payment',
                code: 'pending_payment',
                color: '#fbbf24',
                is_default: false,
                display_order: 7,
            },
            {
                name: 'Paid',
                code: 'paid',
                color: '#22c55e',
                is_default: false,
                display_order: 8,
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
