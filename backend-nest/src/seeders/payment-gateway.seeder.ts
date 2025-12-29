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
                    publishable_key:
                        process.env.STRIPE_PUBLISHABLE_KEY ||
                        'pk_test_51HCgk3Cbz7lg5RoIM70TsNosf3Xasq4BTY5F7KB1KpKtpnes9N81HNRi7S0r15ztICGBIjp2KTP4ndjVaXsjR3oa003Tm2AIax',
                    secret_key:
                        process.env.STRIPE_SECRET_KEY ||
                        'sk_test_51HCgk3Cbz7lg5RoIOoHSPYWtrm12YE3etwgtUamIbG7NITNW3JHvpasnqIDLo6Tm6MA5TLgSQRrWaQRVLFJM71yT00iq1dxXSV',
                    webhook_secret:
                        process.env.STRIPE_WEBHOOK_SECRET ||
                        'whsec_demo_placeholder',
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
