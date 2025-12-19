import { Module } from '@nestjs/common';
import { DiamondTypesService } from './diamond-types.service';
import { DiamondTypesController } from './diamond-types.controller';

@Module({
  providers: [DiamondTypesService],
  controllers: [DiamondTypesController]
})
export class DiamondTypesModule {}
