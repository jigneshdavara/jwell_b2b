import { BaseSeeder } from './base-seeder';

export class PriceRateSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const now = new Date();

        const rates = [
            // Gold rates (per gram in INR)
            {
                metal: 'gold',
                purity: '24K',
                price_per_gram: 13047.0,
                effective_at: now,
            },
            {
                metal: 'gold',
                purity: '22K',
                price_per_gram: 11960.0,
                effective_at: now,
            },
            {
                metal: 'gold',
                purity: '18K',
                price_per_gram: 9787.0,
                effective_at: now,
            },

            // Silver rates (per gram in INR)
            {
                metal: 'silver',
                purity: '999',
                price_per_gram: 189.0,
                effective_at: now,
            },
            {
                metal: 'silver',
                purity: '925',
                price_per_gram: 179.25,
                effective_at: now,
            },

            // Platinum rates (per gram in INR)
            {
                metal: 'platinum',
                purity: '950',
                price_per_gram: 4798.0,
                effective_at: now,
            },
        ];

        for (const rate of rates) {
            const metal = rate.metal.toLowerCase();
            const purity = rate.purity;

            // Find existing rate for this metal/purity combination
            const existingRate = await this.prisma.price_rates.findFirst({
                where: {
                    metal: metal,
                    purity: purity,
                },
                orderBy: {
                    effective_at: 'desc',
                },
            });

            if (existingRate) {
                // Update the most recent rate
                await this.prisma.price_rates.update({
                    where: { id: existingRate.id },
                    data: {
                        price_per_gram: rate.price_per_gram,
                        effective_at: now,
                        source: 'manual',
                        metadata: {
                            seeded: true,
                            seeded_at: now.toISOString(),
                            ...((existingRate.metadata as object) || {}),
                        },
                    },
                });
            } else {
                // Create new rate
                await this.prisma.price_rates.create({
                    data: {
                        metal: metal,
                        purity: purity,
                        price_per_gram: rate.price_per_gram,
                        currency: 'INR',
                        source: 'manual',
                        effective_at: now,
                        metadata: {
                            seeded: true,
                            seeded_at: now.toISOString(),
                        },
                    },
                });
            }
        }

        this.log(`Seeded ${rates.length} price rates`);
    }
}

