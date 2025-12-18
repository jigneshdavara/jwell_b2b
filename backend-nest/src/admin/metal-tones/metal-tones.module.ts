import { Module } from '@nestjs/common';
import { MetalTonesService } from './metal-tones.service';
import { MetalTonesController } from './metal-tones.controller';

@Module({
  providers: [MetalTonesService],
  controllers: [MetalTonesController]
})
export class MetalTonesModule {}
