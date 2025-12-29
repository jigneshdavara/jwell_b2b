import { BaseSeeder } from './base-seeder';

export class StyleSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const styles = [
            {
                code: 'CLS',
                name: 'Classic',
                description: 'Classic and timeless design style',
                display_order: 1,
            },
            {
                code: 'MOD',
                name: 'Modern',
                description: 'Contemporary and modern design style',
                display_order: 2,
            },
            {
                code: 'VIN',
                name: 'Vintage',
                description: 'Vintage and retro design style',
                display_order: 3,
            },
            {
                code: 'TRD',
                name: 'Traditional',
                description: 'Traditional and cultural design style',
                display_order: 4,
            },
            {
                code: 'MIN',
                name: 'Minimalist',
                description: 'Simple and minimalist design style',
                display_order: 5,
            },
            {
                code: 'ART',
                name: 'Art Deco',
                description: 'Art deco style with geometric patterns',
                display_order: 6,
            },
            {
                code: 'ANT',
                name: 'Antique',
                description: 'Antique and heirloom style',
                display_order: 7,
            },
            {
                code: 'BOH',
                name: 'Bohemian',
                description: 'Bohemian and free-spirited style',
                display_order: 8,
            },
            {
                code: 'GLM',
                name: 'Glamour',
                description: 'Glamorous and luxurious style',
                display_order: 9,
            },
            {
                code: 'ETH',
                name: 'Ethnic',
                description: 'Ethnic and cultural design style',
                display_order: 10,
            },
            {
                code: 'CON',
                name: 'Contemporary',
                description: 'Contemporary and trendy style',
                display_order: 11,
            },
            {
                code: 'ELE',
                name: 'Elegant',
                description: 'Elegant and sophisticated style',
                display_order: 12,
            },
            {
                code: 'CAS',
                name: 'Casual',
                description: 'Casual and everyday wear style',
                display_order: 13,
            },
            {
                code: 'FOR',
                name: 'Formal',
                description: 'Formal and occasion wear style',
                display_order: 14,
            },
            {
                code: 'ROM',
                name: 'Romantic',
                description: 'Romantic and delicate style',
                display_order: 15,
            },
            {
                code: 'BOL',
                name: 'Bold',
                description: 'Bold and statement style',
                display_order: 16,
            },
            {
                code: 'DEL',
                name: 'Delicate',
                description: 'Delicate and dainty style',
                display_order: 17,
            },
            {
                code: 'CHU',
                name: 'Chunky',
                description: 'Chunky and substantial style',
                display_order: 18,
            },
            {
                code: 'FES',
                name: 'Festive',
                description: 'Festive and celebratory style',
                display_order: 19,
            },
            {
                code: 'CUS',
                name: 'Custom',
                description: 'Custom and personalized style',
                display_order: 20,
            },
        ];

        for (const style of styles) {
            const existing = await this.prisma.styles.findFirst({
                where: { name: style.name },
            });

            if (existing) {
                await this.prisma.styles.update({
                    where: { id: existing.id },
                    data: {
                        code: style.code,
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
