import { Module } from '@nestjs/common';
import { DiamondShapesService } from './diamond-shapes.service';
import { DiamondShapesController } from './diamond-shapes.controller';

@Module({
    providers: [DiamondShapesService],
    controllers: [DiamondShapesController],
})
export class DiamondShapesModule {}
