import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UnauthorizedException,
    BadRequestException,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { ResendVerificationDto } from './dto/email-verification.dto';
import { ConfirmPasswordDto } from './dto/password-confirm.dto';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.authService.register(registerDto);
        return this.authService.login(user);
    }

    @Post('register/admin')
    @HttpCode(HttpStatus.CREATED)
    async registerAdmin(@Body() registerAdminDto: RegisterAdminDto) {
        const user = await this.authService.registerAdmin(registerAdminDto);
        return this.authService.login(user);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        // Try admin guard first, then user guard
        let user = await this.authService.validateUser(loginDto, 'admin');
        if (!user) {
            user = await this.authService.validateUser(loginDto, 'user');
        }

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.authService.login(user);
    }

    @Post('otp/request')
    @HttpCode(HttpStatus.OK)
    async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
        try {
            return await this.authService.requestOtp(requestOtpDto.email);
        } catch (error) {
            // Log the error for debugging
            console.error('OTP request error:', error);
            
            // Return a user-friendly error message
            if (error instanceof BadRequestException) {
                throw error;
            }
            
            throw new BadRequestException('Failed to send code. Please try again.');
        }
    }

    @Post('otp/verify')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        const customer = await this.authService.verifyOtp(verifyOtpDto);
        return this.authService.login(customer);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Get('verify-email/:id/:hash')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Param('id') id: string, @Param('hash') hash: string) {
        return this.authService.verifyEmail({ id, hash });
    }

    @Post('email/verification-notification')
    @HttpCode(HttpStatus.OK)
    async resendVerification(
        @Body() resendVerificationDto: ResendVerificationDto,
    ) {
        return this.authService.resendVerification(resendVerificationDto);
    }

    @Post('confirm-password')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async confirmPassword(
        @Request() req: any,
        @Body() confirmPasswordDto: ConfirmPasswordDto,
    ) {
        const userId = req.user.userId;
        const guard = req.user.guard || 'user';
        return this.authService.confirmPassword(
            userId,
            guard,
            confirmPasswordDto,
        );
    }
}
