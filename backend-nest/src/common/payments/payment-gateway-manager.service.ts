import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGatewayDriver } from './contracts/payment-gateway-driver.interface';
import { StripeGateway } from './drivers/stripe.gateway';
import { FakeGateway } from './drivers/fake.gateway';

@Injectable()
export class PaymentGatewayManager {
    constructor(private prisma: PrismaService) {}

    async activeGateway(): Promise<any> {
        const gateway = await this.prisma.payment_gateways.findFirst({
            where: { is_active: true },
            orderBy: { is_default: 'desc' },
        });

        if (gateway) {
            return gateway;
        }

        // Fallback to default from config
        const fallbackSlug = process.env.PAYMENT_GATEWAY || 'fake';
        const fallbackGateway = await this.prisma.payment_gateways.findFirst({
            where: { slug: fallbackSlug },
        });

        if (fallbackGateway) {
            return fallbackGateway;
        }

        throw new NotFoundException(
            'No active payment gateway configured.',
        );
    }

    driver(gateway?: any): PaymentGatewayDriver {
        if (!gateway) {
            throw new NotFoundException('Gateway is required');
        }

        const driverClass = gateway.driver;

        if (!driverClass) {
            throw new NotFoundException(
                `No driver registered for payment gateway [${gateway.slug}].`,
            );
        }

        // Map driver class names to implementations
        if (driverClass.includes('StripeGateway') || gateway.slug === 'stripe') {
            return new StripeGateway(gateway);
        }

        if (driverClass.includes('FakeGateway') || gateway.slug === 'fake') {
            return new FakeGateway(gateway);
        }

        throw new NotFoundException(
            `Driver class ${driverClass} not found for gateway ${gateway.slug}`,
        );
    }
}

