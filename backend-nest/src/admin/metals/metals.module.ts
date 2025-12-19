import { Module } from '@nestjs/common';
import { MetalsService } from './metals.service';
import { MetalsController } from './metals.controller';

@Module({
  providers: [MetalsService],
  controllers: [MetalsController]
})
export class MetalsModule {}
