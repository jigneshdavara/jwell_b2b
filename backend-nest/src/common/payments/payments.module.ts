import { Module } from '@nestjs/common';
import { PaymentGatewayManager } from './payment-gateway-manager.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StripeGateway } from './drivers/stripe.gateway';
import { FakeGateway } from './drivers/fake.gateway';

@Module({
    imports: [PrismaModule],
    providers: [PaymentGatewayManager],
    exports: [PaymentGatewayManager],
})
export class PaymentsModule {}

