import { BaseSeeder } from './base-seeder';

export class CatalogSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const catalogs = [
            {
                code: 'WED',
                name: 'Wedding Collection',
                description:
                    'Exquisite wedding jewelry collection featuring engagement rings, wedding bands, and bridal sets',
                display_order: 1,
            },
            {
                code: 'ENG',
                name: 'Engagement Rings',
                description:
                    'Beautiful engagement rings with diamonds and gemstones for your special moment',
                display_order: 2,
            },
            {
                code: 'EVE',
                name: 'Evening Wear',
                description:
                    'Elegant evening jewelry perfect for special occasions and formal events',
                display_order: 3,
            },
            {
                code: 'CAS',
                name: 'Casual Collection',
                description:
                    'Everyday jewelry pieces for casual wear and daily elegance',
                display_order: 4,
            },
            {
                code: 'FES',
                name: 'Festive Collection',
                description:
                    'Traditional and festive jewelry for celebrations and cultural events',
                display_order: 5,
            },
            {
                code: 'PRE',
                name: 'Premium Collection',
                description:
                    'Luxury jewelry pieces with premium diamonds and precious metals',
                display_order: 6,
            },
            {
                code: 'GIF',
                name: 'Gift Collection',
                description:
                    'Thoughtful gift options for birthdays, anniversaries, and special occasions',
                display_order: 7,
            },
            {
                code: 'TRA',
                name: 'Traditional Collection',
                description:
                    'Classic traditional jewelry designs with cultural significance',
                display_order: 8,
            },
            {
                code: 'MOD',
                name: 'Modern Collection',
                description:
                    'Contemporary and modern jewelry designs for the fashion-forward',
                display_order: 9,
            },
            {
                code: 'VIN',
                name: 'Vintage Collection',
                description:
                    'Vintage-inspired jewelry pieces with timeless elegance',
                display_order: 10,
            },
            {
                code: 'MIN',
                name: 'Minimalist Collection',
                description: 'Simple and elegant minimalist jewelry designs',
                display_order: 11,
            },
            {
                code: 'STA',
                name: 'Statement Collection',
                description: 'Bold and eye-catching statement jewelry pieces',
                display_order: 12,
            },
            {
                code: 'BRD',
                name: 'Bridal Collection',
                description:
                    'Complete bridal jewelry sets for the perfect wedding day',
                display_order: 13,
            },
            {
                code: 'ANN',
                name: 'Anniversary Collection',
                description:
                    'Special jewelry pieces to celebrate milestones and anniversaries',
                display_order: 14,
            },
            {
                code: 'VAL',
                name: 'Valentine Collection',
                description:
                    'Romantic jewelry perfect for expressing love and affection',
                display_order: 15,
            },
            {
                code: 'MOT',
                name: "Mother's Day Collection",
                description:
                    'Beautiful jewelry gifts to honor and celebrate mothers',
                display_order: 16,
            },
            {
                code: 'KID',
                name: 'Kids Collection',
                description:
                    'Adorable and safe jewelry pieces designed for children',
                display_order: 17,
            },
            {
                code: 'MEN',
                name: "Men's Collection",
                description: 'Stylish jewelry and accessories designed for men',
                display_order: 18,
            },
            {
                code: 'CUS',
                name: 'Custom Collection',
                description:
                    'Custom-made jewelry pieces tailored to your preferences',
                display_order: 19,
            },
            {
                code: 'LIM',
                name: 'Limited Edition',
                description: 'Exclusive limited edition jewelry pieces',
                display_order: 20,
            },
        ];

        for (const catalog of catalogs) {
            // Check for existing catalog by code OR name (both are unique)
            const existing = await this.prisma.catalogs.findFirst({
                where: {
                    OR: [
                        { code: catalog.code },
                        { name: catalog.name },
                    ],
                },
            });

            if (existing) {
                await this.prisma.catalogs.update({
                    where: { id: existing.id },
                    data: {
                        code: catalog.code,
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
