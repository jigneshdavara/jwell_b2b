import { Module } from '@nestjs/common';
import { UserTypesService } from './user-types.service';
import { UserTypesController } from './user-types.controller';

@Module({
    providers: [UserTypesService],
    controllers: [UserTypesController],
})
export class UserTypesModule {}
