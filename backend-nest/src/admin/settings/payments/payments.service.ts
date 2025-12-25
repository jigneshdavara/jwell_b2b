import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentGatewayManager } from '../../../common/payments/payment-gateway-manager.service';
import { UpdatePaymentSettingsDto } from './dto/payments.dto';

interface GatewayConfig {
    publishable_key?: string;
    secret_key?: string;
    webhook_secret?: string;
}

interface Gateway {
    id: bigint;
    name: string;
    slug: string;
    is_active: boolean;
    config: GatewayConfig | null;
}

@Injectable()
export class PaymentsService {
    constructor(
        private prisma: PrismaService,
        private gatewayManager: PaymentGatewayManager,
    ) {}

    async getPaymentSettings() {
        try {
            const gateway = (await this.gatewayManager.activeGateway()) as Gateway;

            return {
                gateway: {
                    id: Number(gateway.id),
                    name: gateway.name,
                    slug: gateway.slug,
                    is_active: gateway.is_active,
                    config: {
                        publishable_key:
                            gateway.config?.publishable_key || '',
                        secret_key: gateway.config?.secret_key || '',
                        webhook_secret: gateway.config?.webhook_secret || '',
                    },
                },
            };
        } catch {
            // If no gateway exists, return a default structure
            // This allows the frontend to display the form for creating a gateway
            return {
                gateway: {
                    id: 0,
                    name: 'Stripe',
                    slug: 'stripe',
                    is_active: false,
                    config: {
                        publishable_key: '',
                        secret_key: '',
                        webhook_secret: '',
                    },
                },
            };
        }
    }

    async updatePaymentSettings(dto: UpdatePaymentSettingsDto) {
        const gateway = (await this.gatewayManager.activeGateway()) as Gateway;

        const config: GatewayConfig = (gateway.config as GatewayConfig) || {};

        if (dto.publishable_key !== undefined) {
            config.publishable_key = dto.publishable_key;
        }
        if (dto.secret_key !== undefined) {
            config.secret_key = dto.secret_key;
        }
        if (dto.webhook_secret !== undefined) {
            config.webhook_secret = dto.webhook_secret;
        }

        await this.prisma.payment_gateways.update({
            where: { id: gateway.id },
            data: {
                config: config as any,
                is_active:
                    dto.is_active !== undefined
                        ? dto.is_active
                        : gateway.is_active,
            },
        });

        return {
            message: 'Payment settings updated successfully',
        };
    }
}
