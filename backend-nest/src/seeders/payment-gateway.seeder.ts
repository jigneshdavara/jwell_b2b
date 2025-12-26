import { BaseSeeder } from './base-seeder';

export class PaymentGatewaySeeder extends BaseSeeder {
    async run(): Promise<void> {
        const gateways = [
            {
                name: 'Stripe',
                slug: 'stripe',
                driver: 'StripeGateway',
                is_active: true,
                is_default: true,
                config: {
                    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || '',
                    secret_key: process.env.STRIPE_SECRET_KEY || '',
                },
            },
            {
                name: 'Fake Gateway',
                slug: 'fake',
                driver: 'FakeGateway',
                is_active: true,
                is_default: false,
                config: {},
            },
        ];

        for (const gateway of gateways) {
            await this.prisma.payment_gateways.upsert({
                where: { slug: gateway.slug },
                update: {
                    name: gateway.name,
                    driver: gateway.driver,
                    is_active: gateway.is_active,
                    is_default: gateway.is_default,
                    config: gateway.config as any,
                },
                create: {
                    name: gateway.name,
                    slug: gateway.slug,
                    driver: gateway.driver,
                    is_active: gateway.is_active,
                    is_default: gateway.is_default,
                    config: gateway.config as any,
                },
            });
        }

        this.log(`Seeded ${gateways.length} payment gateways`);
    }
}
