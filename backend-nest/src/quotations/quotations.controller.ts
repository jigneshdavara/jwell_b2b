import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import {
    CreateQuotationDto,
    StoreQuotationMessageDto,
} from './dto/quotation.dto';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
    constructor(private readonly quotationsService: QuotationsService) {}

    @Get()
    findAll(@Request() req) {
        return this.quotationsService.findAll(BigInt(req.user.userId));
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quotationsService.findOne(id, BigInt(req.user.userId));
    }

    @Post()
    create(@Body() dto: CreateQuotationDto, @Request() req) {
        return this.quotationsService.create(dto, BigInt(req.user.userId));
    }

    @Post('from-cart')
    storeFromCart(@Request() req) {
        return this.quotationsService.storeFromCart(BigInt(req.user.userId));
    }

    @Post(':id/messages')
    addMessage(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: StoreQuotationMessageDto,
        @Request() req,
    ) {
        return this.quotationsService.addMessage(
            id,
            dto.message,
            BigInt(req.user.userId),
            'customer',
        );
    }

    @Post(':id/confirm')
    confirm(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quotationsService.confirm(id, BigInt(req.user.userId));
    }

    @Post(':id/decline')
    decline(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.quotationsService.decline(id, BigInt(req.user.userId));
    }
}
