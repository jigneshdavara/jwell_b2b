import { Module } from '@nestjs/common';
import { UserGroupsService } from './user-groups.service';
import { UserGroupsController } from './user-groups.controller';

@Module({
  providers: [UserGroupsService],
  controllers: [UserGroupsController]
})
export class UserGroupsModule {}
