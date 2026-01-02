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

    @Get(':quotation_group_id')
    async show(
        @Param('quotation_group_id') quotationGroupId: string,
        @Request() req: any,
    ) {
        const userId = BigInt(req.user.userId);
        const quotation = await this.quotationsService.findByGroupId(
            quotationGroupId,
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

    @Delete(':quotation_group_id')
    @HttpCode(HttpStatus.OK)
    async destroy(
        @Param('quotation_group_id') quotationGroupId: string,
        @Request() req: any,
    ) {
        const userId = BigInt(req.user.userId);
        return await this.quotationsService.removeByGroupId(
            quotationGroupId,
            userId,
        );
    }

    @Post(':quotation_group_id/messages')
    @HttpCode(HttpStatus.CREATED)
    async message(
        @Param('quotation_group_id') quotationGroupId: string,
        @Body() dto: StoreQuotationMessageDto,
        @Request() req: any,
    ) {
        const userId = BigInt(req.user.userId);
        const result = await this.quotationsService.createMessageByGroupId(
            quotationGroupId,
            dto,
            userId,
        );
        return result;
    }

    @Post(':quotation_group_id/confirm')
    @HttpCode(HttpStatus.CREATED)
    async confirm(
        @Param('quotation_group_id') quotationGroupId: string,
        @Request() req: any,
    ) {
        const userId = BigInt(req.user.userId);
        return await this.quotationsService.confirmByGroupId(
            quotationGroupId,
            userId,
        );
    }

    @Post(':quotation_group_id/decline')
    @HttpCode(HttpStatus.CREATED)
    async decline(
        @Param('quotation_group_id') quotationGroupId: string,
        @Request() req: any,
    ) {
        const userId = BigInt(req.user.userId);
        return await this.quotationsService.declineByGroupId(
            quotationGroupId,
            userId,
        );
    }
}
