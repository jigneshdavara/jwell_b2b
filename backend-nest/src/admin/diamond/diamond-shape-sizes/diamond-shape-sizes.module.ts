import { Module } from '@nestjs/common';
import { DiamondShapeSizesService } from './diamond-shape-sizes.service';
import { DiamondShapeSizesController } from './diamond-shape-sizes.controller';

@Module({
    providers: [DiamondShapeSizesService],
    controllers: [DiamondShapeSizesController],
})
export class DiamondShapeSizesModule {}
