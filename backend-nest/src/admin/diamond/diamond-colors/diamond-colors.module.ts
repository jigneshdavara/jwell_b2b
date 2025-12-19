import { Module } from '@nestjs/common';
import { DiamondColorsService } from './diamond-colors.service';
import { DiamondColorsController } from './diamond-colors.controller';

@Module({
  providers: [DiamondColorsService],
  controllers: [DiamondColorsController]
})
export class DiamondColorsModule {}
