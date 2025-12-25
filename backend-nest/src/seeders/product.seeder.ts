import { BaseSeeder } from './base-seeder';

export class ProductSeeder extends BaseSeeder {
    async run(): Promise<void> {
        // Get required relations
        const brand = await this.prisma.brands.findFirst({ where: { code: 'TAN' } });
        const category = await this.prisma.categories.findFirst({ where: { code: 'RINGS' } });

        if (!brand || !category) {
            this.log('⚠️  Brand or Category not found. Skipping product seeding.');
            return;
        }

        const products = [
            {
                name: 'Classic Gold Ring',
                titleline: 'Elegant traditional design',
                sku: 'RING-GOLD-001',
                description: 'Beautiful classic gold ring with intricate designs',
                making_charge_amount: 500,
                making_charge_percentage: 10,
            },
            {
                name: 'Diamond Solitaire Ring',
                titleline: 'Premium diamond ring',
                sku: 'RING-DIAMOND-001',
                description: 'Stunning diamond solitaire ring in gold setting',
                making_charge_amount: 1000,
                making_charge_percentage: 12,
            },
            {
                name: 'Traditional Gold Necklace',
                titleline: 'Heavy traditional necklace',
                sku: 'NECK-GOLD-001',
                description: 'Traditional heavy gold necklace with detailed work',
                making_charge_amount: 2000,
                making_charge_percentage: 15,
            },
        ];

        for (const product of products) {
            await this.prisma.products.upsert({
                where: { sku: product.sku },
                update: {
                    name: product.name,
                    titleline: product.titleline,
                    description: product.description,
                    making_charge_amount: product.making_charge_amount,
                    making_charge_percentage: product.making_charge_percentage,
                    is_active: true,
                },
                create: {
                    name: product.name,
                    titleline: product.titleline,
                    sku: product.sku,
                    brand_id: brand.id,
                    category_id: category.id,
                    description: product.description,
                    making_charge_amount: product.making_charge_amount,
                    making_charge_percentage: product.making_charge_percentage,
                    is_active: true,
                },
            });
        }

        this.log(`Seeded ${products.length} products`);
    }
}

