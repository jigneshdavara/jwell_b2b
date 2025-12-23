import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { UserTypesService } from './user-types.service';
import {
    CreateUserTypeDto,
    UpdateUserTypeDto,
    BulkDestroyDto,
} from './dto/user-type.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/user-types')
@UseGuards(JwtAuthGuard)
export class UserTypesController {
    constructor(
        private readonly userTypesService: UserTypesService,
    ) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '20',
    ) {
        return this.userTypesService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userTypesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateUserTypeDto) {
        return this.userTypesService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserTypeDto,
    ) {
        return this.userTypesService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.userTypesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.userTypesService.remove(id);
    }
}

