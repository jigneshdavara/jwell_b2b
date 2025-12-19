import { Module } from '@nestjs/common';
import { DiamondClaritiesService } from './diamond-clarities.service';
import { DiamondClaritiesController } from './diamond-clarities.controller';

@Module({
    providers: [DiamondClaritiesService],
    controllers: [DiamondClaritiesController],
})
export class DiamondClaritiesModule {}
