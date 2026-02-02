import { Module } from '@nestjs/common';
import { AdminGroupsService } from './admin-groups.service';
import { AdminGroupsController } from './admin-groups.controller';

@Module({
    providers: [AdminGroupsService],
    controllers: [AdminGroupsController],
})
export class AdminGroupsModule {}
