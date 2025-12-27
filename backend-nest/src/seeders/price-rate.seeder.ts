import { PrismaService } from '../prisma/prisma.service';
import { BaseSeeder } from './base-seeder';

export class PriceRateSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const rates = [
            {
                metal: 'gold',
                purity: '24K',
                price_per_gram: 6500,
                currency: 'INR',
                source: 'manual',
            },
            {
                metal: 'gold',
                purity: '22K',
                price_per_gram: 5958,
                currency: 'INR',
                source: 'manual',
            },
            {
                metal: 'gold',
                purity: '18K',
                price_per_gram: 4875,
                currency: 'INR',
                source: 'manual',
            },
            {
                metal: 'gold',
                purity: '14K',
                price_per_gram: 3792,
                currency: 'INR',
                source: 'manual',
            },
            {
                metal: 'silver',
                purity: '925',
                price_per_gram: 85,
                currency: 'INR',
                source: 'manual',
            },
            {
                metal: 'silver',
                purity: '999',
                price_per_gram: 92,
                currency: 'INR',
                source: 'manual',
            },
            {
                metal: 'platinum',
                purity: null,
                price_per_gram: 3500,
                currency: 'INR',
                source: 'manual',
            },
        ];

        const now = new Date();
        for (const rate of rates) {
            await this.prisma.price_rates.create({
                data: {
                    metal: rate.metal,
                    purity: rate.purity,
                    price_per_gram: rate.price_per_gram,
                    currency: rate.currency,
                    source: rate.source,
                    effective_at: now,
                },
            });
        }

        this.log(`Seeded ${rates.length} price rates`);
    }
}

