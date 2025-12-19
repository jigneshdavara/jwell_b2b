import { Module } from '@nestjs/common';
import { MetalPuritiesService } from './metal-purities.service';
import { MetalPuritiesController } from './metal-purities.controller';

@Module({
    providers: [MetalPuritiesService],
    controllers: [MetalPuritiesController],
})
export class MetalPuritiesModule {}
