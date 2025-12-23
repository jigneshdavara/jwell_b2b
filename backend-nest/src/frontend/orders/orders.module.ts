import { Module } from '@nestjs/common';
import { FrontendOrdersController } from './orders.controller';
import { FrontendOrdersService } from './orders.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { KycModule } from '../../kyc/kyc.module';

@Module({
    imports: [PrismaModule, KycModule],
    controllers: [FrontendOrdersController],
    providers: [FrontendOrdersService],
    exports: [FrontendOrdersService],
})
export class FrontendOrdersModule {}

