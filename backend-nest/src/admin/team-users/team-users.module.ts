import { Module } from '@nestjs/common';
import { TeamUsersService } from './team-users.service';
import { TeamUsersController } from './team-users.controller';

@Module({
    providers: [TeamUsersService],
    controllers: [TeamUsersController],
})
export class TeamUsersModule {}
