import { Module } from '@nestjs/common';
import { FrontendCartController } from './cart.controller';
import { CartModule as BaseCartModule } from '../../cart/cart.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [BaseCartModule, PrismaModule],
    controllers: [FrontendCartController],
})
export class FrontendCartModule {}

