import { Module } from '@nestjs/common';
import { NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { KycModule } from '../../kyc/kyc.module';

@Module({
    imports: [PrismaModule, KycModule],
    controllers: [NavigationController],
    providers: [NavigationService],
    exports: [NavigationService],
})
export class NavigationModule {}

