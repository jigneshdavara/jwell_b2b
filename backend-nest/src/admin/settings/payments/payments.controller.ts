import {
    Controller,
    Get,
    Put,
    Body,
    UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { UpdatePaymentSettingsDto } from './dto/payments.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';

@Controller('admin/settings/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Get()
    getPaymentSettings() {
        return this.paymentsService.getPaymentSettings();
    }

    @Put()
    updatePaymentSettings(@Body() dto: UpdatePaymentSettingsDto) {
        return this.paymentsService.updatePaymentSettings(dto);
    }
}





