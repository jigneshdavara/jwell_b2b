import { Module } from '@nestjs/common';
import { FrontendOrdersController } from './orders.controller';
import { FrontendOrdersService } from './orders.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FrontendOrdersController],
    providers: [FrontendOrdersService],
    exports: [FrontendOrdersService],
})
export class FrontendOrdersModule {}

