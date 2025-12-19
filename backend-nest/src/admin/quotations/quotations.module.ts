import { Module } from '@nestjs/common';
import { AdminQuotationsController } from './quotations.controller';
import { QuotationsModule } from '../../quotations/quotations.module';

@Module({
    imports: [QuotationsModule],
    controllers: [AdminQuotationsController],
})
export class AdminQuotationsModule {}
