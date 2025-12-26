import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FrontendQuotationsService } from './quotations.service';
import {
    CreateQuotationDto,
    StoreQuotationMessageDto,
} from './dto/quotation.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';

@Controller('quotations')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class FrontendQuotationsController {
    constructor(private quotationsService: FrontendQuotationsService) {}

    @Get()
    async index(@Request() req: any) {
        const userId = BigInt(req.user.userId);
        const quotations = await this.quotationsService.findAll(userId);
        return { quotations };
    }

    @Get(':id')
    async show(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const quotationId = BigInt(id);
        const userId = BigInt(req.user.userId);
        const quotation = await this.quotationsService.findOne(
            quotationId,
            userId,
        );
        return { quotation }; // Ensure explicit return format
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async store(@Body() dto: CreateQuotationDto, @Request() req: any) {
        const userId = BigInt(req.user.userId);
        return await this.quotationsService.create(dto, userId);
    }

    @Post('from-cart')
    @HttpCode(HttpStatus.CREATED)
    async storeFromCart(@Request() req: any) {
        const userId = BigInt(req.user.userId);
        return await this.quotationsService.createFromCart(userId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async destroy(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const quotationId = BigInt(id);
        const userId = BigInt(req.user.userId);
        return await this.quotationsService.remove(quotationId, userId);
    }

    @Post(':id/messages')
    @HttpCode(HttpStatus.CREATED)
    async message(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: StoreQuotationMessageDto,
        @Request() req: any,
    ) {
        const quotationId = BigInt(id);
        const userId = BigInt(req.user.userId);
        const result = await this.quotationsService.createMessage(
            quotationId,
            dto,
            userId,
        );
        return result;
    }

    @Post(':id/confirm')
    @HttpCode(HttpStatus.CREATED)
    async confirm(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const quotationId = BigInt(id);
        const userId = BigInt(req.user.userId);
        return await this.quotationsService.confirm(quotationId, userId);
    }

    @Post(':id/decline')
    @HttpCode(HttpStatus.CREATED)
    async decline(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const quotationId = BigInt(id);
        const userId = BigInt(req.user.userId);
        return await this.quotationsService.decline(quotationId, userId);
    }
}
