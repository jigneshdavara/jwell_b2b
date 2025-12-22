import { Module } from '@nestjs/common';
import { FrontendCheckoutController } from './checkout.controller';
import { FrontendCheckoutService } from './checkout.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CartModule } from '../../cart/cart.module';
import { PaymentsModule } from '../../common/payments/payments.module';
import { OrdersModule } from '../../admin/orders/orders.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
    imports: [
        PrismaModule,
        CartModule,
        PaymentsModule,
        OrdersModule,
        MailModule,
    ],
    controllers: [FrontendCheckoutController],
    providers: [FrontendCheckoutService],
    exports: [FrontendCheckoutService],
})
export class FrontendCheckoutModule {}

