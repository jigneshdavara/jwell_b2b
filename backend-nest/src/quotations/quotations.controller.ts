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

    @Get(':quotation_group_id')
    findOne(
        @Param('quotation_group_id') quotationGroupId: string,
        @Request() req,
    ) {
        return this.quotationsService.findByGroupId(
            quotationGroupId,
            BigInt(req.user.userId),
        );
    }

    @Post()
    create(@Body() dto: CreateQuotationDto, @Request() req) {
        return this.quotationsService.create(dto, BigInt(req.user.userId));
    }

    @Post('from-cart')
    storeFromCart(@Request() req) {
        return this.quotationsService.storeFromCart(BigInt(req.user.userId));
    }

    @Post(':quotation_group_id/messages')
    addMessage(
        @Param('quotation_group_id') quotationGroupId: string,
        @Body() dto: StoreQuotationMessageDto,
        @Request() req,
    ) {
        return this.quotationsService.addMessageByGroupId(
            quotationGroupId,
            dto.message,
            BigInt(req.user.userId),
            'user',
        );
    }

    @Post(':quotation_group_id/confirm')
    confirm(
        @Param('quotation_group_id') quotationGroupId: string,
        @Request() req,
    ) {
        return this.quotationsService.confirmByGroupId(
            quotationGroupId,
            BigInt(req.user.userId),
        );
    }

    @Post(':quotation_group_id/decline')
    decline(
        @Param('quotation_group_id') quotationGroupId: string,
        @Request() req,
    ) {
        return this.quotationsService.declineByGroupId(
            quotationGroupId,
            BigInt(req.user.userId),
        );
    }
}
