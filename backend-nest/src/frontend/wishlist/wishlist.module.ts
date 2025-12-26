import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CartModule } from '../../cart/cart.module';
import { KycModule } from '../../kyc/kyc.module';

@Module({
    imports: [PrismaModule, CartModule, KycModule],
    controllers: [WishlistController],
    providers: [WishlistService],
})
export class WishlistModule {}
