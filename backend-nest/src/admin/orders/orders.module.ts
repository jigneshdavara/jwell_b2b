import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderWorkflowService } from './order-workflow.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [OrdersService, OrderWorkflowService],
    controllers: [OrdersController],
    exports: [OrdersService, OrderWorkflowService],
})
export class OrdersModule {}
