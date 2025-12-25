import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsModule as CommonPaymentsModule } from '../../../common/payments/payments.module';

@Module({
    imports: [CommonPaymentsModule],
    providers: [PaymentsService],
    controllers: [PaymentsController],
})
export class PaymentsSettingsModule {}

