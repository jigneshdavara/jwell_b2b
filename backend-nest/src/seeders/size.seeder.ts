import { BaseSeeder } from './base-seeder';

export class SizeSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const sizes = [
            {
                code: 'SIZE_1',
                name: 'Size 1',
                description: 'Small size',
                display_order: 1,
            },
            {
                code: 'SIZE_2',
                name: 'Size 2',
                description: 'Medium size',
                display_order: 2,
            },
            {
                code: 'SIZE_3',
                name: 'Size 3',
                description: 'Large size',
                display_order: 3,
            },
            {
                code: 'SIZE_4',
                name: 'Size 4',
                description: 'Extra large size',
                display_order: 4,
            },
            {
                code: 'SIZE_5',
                name: 'Size 5',
                description: 'Custom size',
                display_order: 5,
            },
        ];

        for (const size of sizes) {
            const existing = await this.prisma.sizes.findFirst({
                where: { code: size.code },
            });

            if (existing) {
                await this.prisma.sizes.update({
                    where: { id: existing.id },
                    data: {
                        name: size.name,
                        description: size.description,
                        is_active: true,
                        display_order: size.display_order,
                    },
                });
            } else {
                await this.prisma.sizes.create({
                    data: {
                        code: size.code,
                        name: size.name,
                        description: size.description,
                        is_active: true,
                        display_order: size.display_order,
                    },
                });
            }
        }

        this.log(`Seeded ${sizes.length} sizes`);
    }
}
