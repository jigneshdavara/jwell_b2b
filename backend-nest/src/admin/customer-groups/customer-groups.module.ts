import { Module } from '@nestjs/common';
import { CustomerGroupsService } from './customer-groups.service';
import { CustomerGroupsController } from './customer-groups.controller';

@Module({
    providers: [CustomerGroupsService],
    controllers: [CustomerGroupsController],
})
export class CustomerGroupsModule {}
