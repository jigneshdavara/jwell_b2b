import {
    Controller,
    Post,
    Body,
    UnauthorizedException,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';

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
        // Try admin guard first, then web guard
        let user = await this.authService.validateUser(loginDto, 'admin');
        if (!user) {
            user = await this.authService.validateUser(loginDto, 'web');
        }

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.authService.login(user);
    }

    @Post('otp/request')
    @HttpCode(HttpStatus.OK)
    async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
        return this.authService.requestOtp(requestOtpDto.email);
    }

    @Post('otp/verify')
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        const customer = await this.authService.verifyOtp(verifyOtpDto);
        return this.authService.login(customer);
    }
}
