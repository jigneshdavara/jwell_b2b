import { Module } from '@nestjs/common';
import { DiamondsService } from './diamonds.service';
import { DiamondsController } from './diamonds.controller';

@Module({
    providers: [DiamondsService],
    controllers: [DiamondsController],
})
export class DiamondsModule {}
