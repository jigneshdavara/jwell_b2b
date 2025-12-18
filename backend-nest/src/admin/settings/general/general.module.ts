import { Module } from '@nestjs/common';
import { GeneralSettingsService } from './general.service';
import { GeneralSettingsController } from './general.controller';

@Module({
  providers: [GeneralSettingsService],
  controllers: [GeneralSettingsController]
})
export class GeneralSettingsModule {}
