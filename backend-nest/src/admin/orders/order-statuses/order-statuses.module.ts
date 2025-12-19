import { Module } from '@nestjs/common';
import { OrderStatusesService } from './order-statuses.service';
import { OrderStatusesController } from './order-statuses.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [OrderStatusesController],
    providers: [OrderStatusesService],
    exports: [OrderStatusesService],
})
export class OrderStatusesModule {}
