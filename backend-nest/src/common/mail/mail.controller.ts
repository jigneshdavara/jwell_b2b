import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MailService } from './mail.service';

export class SendOrderConfirmationDto {
    orderId: number;
    paymentId: number;
}

export class SendLoginOtpDto {
    email: string;
    code: string;
    expiresIn: string;
}

export class SendQuotationApprovedDto {
    quotationId: number;
}

export class SendQuotationRejectedDto {
    quotationId: number;
    reason?: string;
}

export class SendQuotationSubmittedDto {
    quotationId: number;
}

export class SendQuotationConfirmationRequestDto {
    quotationId: number;
    message?: string;
}

export class SendQuotationStatusUpdatedDto {
    quotationId: number;
}

@Controller('mail')
export class MailController {
    constructor(private readonly mailService: MailService) {}

    @Post('order-confirmation')
    @HttpCode(HttpStatus.OK)
    async sendOrderConfirmation(@Body() dto: SendOrderConfirmationDto): Promise<{ success: boolean }> {
        await this.mailService.sendOrderConfirmation(dto.orderId, dto.paymentId);
        return { success: true };
    }

    @Post('admin-order-notification')
    @HttpCode(HttpStatus.OK)
    async sendAdminOrderNotification(@Body() dto: SendOrderConfirmationDto): Promise<{ success: boolean }> {
        await this.mailService.sendAdminOrderNotification(dto.orderId, dto.paymentId);
        return { success: true };
    }

    @Post('welcome-email')
    @HttpCode(HttpStatus.OK)
    async sendWelcomeEmail(@Body() dto: { userId: number }): Promise<{ success: boolean }> {
        await this.mailService.sendWelcomeEmail(dto.userId);
        return { success: true };
    }

    @Post('admin-new-user')
    @HttpCode(HttpStatus.OK)
    async sendAdminNewUserNotification(@Body() dto: { userId: number }): Promise<{ success: boolean }> {
        await this.mailService.sendAdminNewUserNotification(dto.userId);
        return { success: true };
    }

    @Post('login-otp')
    @HttpCode(HttpStatus.OK)
    async sendLoginOtp(@Body() dto: SendLoginOtpDto): Promise<{ success: boolean }> {
        await this.mailService.sendLoginOtp(dto.email, dto.code, dto.expiresIn);
        return { success: true };
    }

    @Post('quotation-approved')
    @HttpCode(HttpStatus.OK)
    async sendQuotationApproved(@Body() dto: SendQuotationApprovedDto): Promise<{ success: boolean }> {
        await this.mailService.sendQuotationApproved(dto.quotationId);
        return { success: true };
    }

    @Post('quotation-rejected')
    @HttpCode(HttpStatus.OK)
    async sendQuotationRejected(@Body() dto: SendQuotationRejectedDto): Promise<{ success: boolean }> {
        await this.mailService.sendQuotationRejected(dto.quotationId, dto.reason);
        return { success: true };
    }

    @Post('quotation-submitted-customer')
    @HttpCode(HttpStatus.OK)
    async sendQuotationSubmittedUser(@Body() dto: SendQuotationSubmittedDto): Promise<{ success: boolean }> {
        await this.mailService.sendQuotationSubmittedUser(dto.quotationId);
        return { success: true };
    }

    @Post('quotation-submitted-admin')
    @HttpCode(HttpStatus.OK)
    async sendQuotationSubmittedAdmin(@Body() dto: SendQuotationSubmittedDto): Promise<{ success: boolean }> {
        await this.mailService.sendQuotationSubmittedAdmin(dto.quotationId);
        return { success: true };
    }

    @Post('quotation-confirmation-request')
    @HttpCode(HttpStatus.OK)
    async sendQuotationConfirmationRequest(@Body() dto: SendQuotationConfirmationRequestDto): Promise<{ success: boolean }> {
        await this.mailService.sendQuotationConfirmationRequest(dto.quotationId, dto.message);
        return { success: true };
    }

    @Post('quotation-status-updated')
    @HttpCode(HttpStatus.OK)
    async sendQuotationStatusUpdated(@Body() dto: SendQuotationStatusUpdatedDto): Promise<{ success: boolean }> {
        await this.mailService.sendQuotationStatusUpdated(dto.quotationId);
        return { success: true };
    }
}

