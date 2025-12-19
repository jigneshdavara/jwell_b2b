import { Module } from '@nestjs/common';
import { StylesService } from './styles.service';
import { StylesController } from './styles.controller';

@Module({
  providers: [StylesService],
  controllers: [StylesController]
})
export class StylesModule {}
