import { PrismaService } from '../prisma/prisma.service';
import { BaseSeeder } from './base-seeder';

export class CategorySeeder extends BaseSeeder {
    async run(): Promise<void> {
        const categories = [
            { code: 'RINGS', name: 'Rings', description: 'Beautiful rings for all occasions', display_order: 1 },
            { code: 'NECKLACES', name: 'Necklaces', description: 'Elegant necklaces and chains', display_order: 2 },
            { code: 'EARRINGS', name: 'Earrings', description: 'Stylish earrings collection', display_order: 3 },
            { code: 'BRACELETS', name: 'Bracelets', description: 'Charming bracelets and bangles', display_order: 4 },
            { code: 'PENDANTS', name: 'Pendants', description: 'Exquisite pendants and lockets', display_order: 5 },
            { code: 'BANGLES', name: 'Bangles', description: 'Traditional and modern bangles', display_order: 6 },
            { code: 'CHAINS', name: 'Chains', description: 'Gold and diamond chains', display_order: 7 },
            { code: 'SETS', name: 'Jewelry Sets', description: 'Complete jewelry sets', display_order: 8 },
        ];

        for (const category of categories) {
            const existing = await this.prisma.categories.findFirst({
                where: { name: category.name },
            });

            if (existing) {
                await this.prisma.categories.update({
                    where: { id: existing.id },
                    data: {
                        code: category.code,
                        description: category.description,
                        is_active: true,
                        display_order: category.display_order,
                    },
                });
            } else {
                await this.prisma.categories.create({
                    data: {
                        code: category.code,
                        name: category.name,
                        description: category.description,
                        is_active: true,
                        display_order: category.display_order,
                    },
                });
            }
        }

        this.log(`Seeded ${categories.length} categories`);
    }
}

