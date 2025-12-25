import { BaseSeeder } from './base-seeder';

export class StyleSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const styles = [
            { code: 'TRADITIONAL', name: 'Traditional', description: 'Traditional jewelry designs', display_order: 1 },
            { code: 'MODERN', name: 'Modern', description: 'Modern and contemporary designs', display_order: 2 },
            { code: 'FUSION', name: 'Fusion', description: 'Fusion of traditional and modern', display_order: 3 },
            { code: 'VINTAGE', name: 'Vintage', description: 'Vintage and antique designs', display_order: 4 },
            { code: 'MINIMALIST', name: 'Minimalist', description: 'Minimalist and elegant designs', display_order: 5 },
        ];

        for (const style of styles) {
            const existing = await this.prisma.styles.findFirst({
                where: { code: style.code },
            });

            if (existing) {
                await this.prisma.styles.update({
                    where: { id: existing.id },
                    data: {
                        name: style.name,
                        description: style.description,
                        is_active: true,
                        display_order: style.display_order,
                    },
                });
            } else {
                await this.prisma.styles.create({
                    data: {
                        code: style.code,
                        name: style.name,
                        description: style.description,
                        is_active: true,
                        display_order: style.display_order,
                    },
                });
            }
        }

        this.log(`Seeded ${styles.length} styles`);
    }
}

