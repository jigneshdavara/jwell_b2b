import { PrismaService } from '../prisma/prisma.service';
import { BaseSeeder } from './base-seeder';
import { BrandSeeder } from './brand.seeder';
import { CategorySeeder } from './category.seeder';
import { CatalogSeeder } from './catalog.seeder';
import { DiamondDataSeeder } from './diamond-data.seeder';
import { GeneralSettingsSeeder } from './general-settings.seeder';
import { MetalDataSeeder } from './metal-data.seeder';
import { OrderStatusSeeder } from './order-status.seeder';
import { PaymentGatewaySeeder } from './payment-gateway.seeder';
import { PriceRateSeeder } from './price-rate.seeder';
import { SizeSeeder } from './size.seeder';
import { StyleSeeder } from './style.seeder';
import { UserAndKycSeeder } from './user-and-kyc.seeder';
import { ProductSeeder } from './product.seeder';

/**
 * Main database seeder that runs all seeders
 * Similar to Laravel's DatabaseSeeder
 */
export class DatabaseSeeder {
    private seeders: (new (prisma: PrismaService) => BaseSeeder)[] = [
        BrandSeeder,
        CategorySeeder,
        CatalogSeeder,
        DiamondDataSeeder,
        GeneralSettingsSeeder,
        MetalDataSeeder,
        OrderStatusSeeder,
        PaymentGatewaySeeder,
        PriceRateSeeder,
        SizeSeeder,
        StyleSeeder,
        UserAndKycSeeder,
        ProductSeeder,
    ];

    constructor(private prisma: PrismaService) {}

    async seed(): Promise<void> {
        console.log('🌱 Starting database seeding...\n');

        for (const SeederClass of this.seeders) {
            const seeder = new SeederClass(this.prisma);
            const seederName = SeederClass.name;

            try {
                console.log(`Running ${seederName}...`);
                await seeder.run();
                console.log(`✅ ${seederName} completed\n`);
            } catch (error) {
                console.error(`❌ ${seederName} failed:`, error);
                throw error;
            }
        }

        console.log('✨ Database seeding completed successfully!');
    }
}
