import { Module } from '@nestjs/common';
import { TaxGroupsService } from './tax-groups.service';
import { TaxGroupsController } from './tax-groups.controller';

@Module({
    providers: [TaxGroupsService],
    controllers: [TaxGroupsController],
})
export class TaxGroupsModule {}
