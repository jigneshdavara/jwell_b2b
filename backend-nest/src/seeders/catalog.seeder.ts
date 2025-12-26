import { BaseSeeder } from './base-seeder';

export class CatalogSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const catalogs = [
            {
                code: 'NEW_ARRIVALS',
                name: 'New Arrivals',
                description: 'Latest jewelry collections',
                display_order: 1,
            },
            {
                code: 'BESTSELLERS',
                name: 'Bestsellers',
                description: 'Most popular jewelry pieces',
                display_order: 2,
            },
            {
                code: 'WEDDING',
                name: 'Wedding Collection',
                description: 'Elegant wedding jewelry',
                display_order: 3,
            },
            {
                code: 'FESTIVE',
                name: 'Festive Collection',
                description: 'Special occasion jewelry',
                display_order: 4,
            },
            {
                code: 'DAILY_WEAR',
                name: 'Daily Wear',
                description: 'Everyday jewelry collection',
                display_order: 5,
            },
        ];

        for (const catalog of catalogs) {
            const existing = await this.prisma.catalogs.findFirst({
                where: { code: catalog.code },
            });

            if (existing) {
                await this.prisma.catalogs.update({
                    where: { id: existing.id },
                    data: {
                        name: catalog.name,
                        description: catalog.description,
                        is_active: true,
                        display_order: catalog.display_order,
                    },
                });
            } else {
                await this.prisma.catalogs.create({
                    data: {
                        code: catalog.code,
                        name: catalog.name,
                        description: catalog.description,
                        is_active: true,
                        display_order: catalog.display_order,
                    },
                });
            }
        }

        this.log(`Seeded ${catalogs.length} catalogs`);
    }
}
