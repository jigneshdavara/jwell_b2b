import { Module } from '@nestjs/common';
import { NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [NavigationController],
    providers: [NavigationService],
    exports: [NavigationService],
})
export class NavigationModule {}

