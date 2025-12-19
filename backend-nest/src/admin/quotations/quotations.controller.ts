import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseIntPipe,
    Request,
} from '@nestjs/common';
import { QuotationsService } from '../../quotations/quotations.service';
import {
    QuotationFilterDto,
    ApproveQuotationDto,
    RequestConfirmationDto,
    AddQuotationItemDto,
    UpdateQuotationProductDto,
    StoreQuotationMessageDto,
} from '../../quotations/dto/quotation.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/quotations')
@UseGuards(JwtAuthGuard)
export class AdminQuotationsController {
    constructor(private readonly quotationsService: QuotationsService) {}

    @Get()
    findAll(@Query() filters: QuotationFilterDto) {
        return this.quotationsService.findAllAdmin(filters);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.quotationsService.findOneAdmin(id);
    }

    @Post(':id/approve')
    approve(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ApproveQuotationDto,
    ) {
        return this.quotationsService.approve(id, dto.admin_notes);
    }

    @Post(':id/reject')
    reject(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ApproveQuotationDto,
    ) {
        return this.quotationsService.reject(id, dto.admin_notes);
    }

    @Post(':id/messages')
    message(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: StoreQuotationMessageDto,
        @Request() req,
    ) {
        return this.quotationsService.addMessage(
            id,
            dto.message,
            BigInt(req.user.userId),
            'admin',
        );
    }

    @Post(':id/request-confirmation')
    requestConfirmation(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RequestConfirmationDto,
    ) {
        return this.quotationsService.requestConfirmation(id, dto);
    }

    @Post(':id/add-item')
    addItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AddQuotationItemDto,
    ) {
        return this.quotationsService.addItemAdmin(id, dto);
    }

    @Post(':id/update-product')
    updateProduct(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateQuotationProductDto,
    ) {
        return this.quotationsService.updateProductAdmin(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        // This removes a single item from a group
        return this.quotationsService.remove(id);
    }
}
