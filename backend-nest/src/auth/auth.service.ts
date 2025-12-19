import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/otp.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto) {
        const { password, password_confirmation, email, ...rest } = registerDto;

        if (password !== password_confirmation) {
            throw new BadRequestException('Passwords do not match');
        }

        const existingCustomer = await this.prisma.customer.findUnique({
            where: { email },
        });
        if (existingCustomer) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return await this.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.create({
                data: {
                    name: rest.name,
                    email,
                    phone: rest.phone,
                    password: hashedPassword,
                    type: rest.account_type,
                    kyc_status: 'pending',
                },
            });

            await tx.userKycProfile.create({
                data: {
                    user_id: customer.id,
                    business_name: rest.business_name,
                    business_website: rest.website,
                    gst_number: rest.gst_number,
                    pan_number: rest.pan_number,
                    registration_number: rest.registration_number,
                    address_line1: rest.address_line1,
                    address_line2: rest.address_line2,
                    city: rest.city,
                    state: rest.state,
                    postal_code: rest.postal_code,
                    country: rest.country || 'India',
                    contact_name: rest.contact_name || rest.name,
                    contact_phone: rest.contact_phone || rest.phone,
                },
            });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...result } = customer;
            return { ...result, guard: 'web' } as any;
        });
    }

    async validateUser(
        loginDto: LoginDto,
        guard: 'admin' | 'web',
    ): Promise<any> {
        const { email, password } = loginDto;

        let user: any;
        if (guard === 'admin') {
            user = await this.prisma.user.findUnique({ where: { email } });
        } else {
            user = await this.prisma.customer.findUnique({ where: { email } });
        }

        if (!user) {
            return null;
        }

        /**
         * COMPATIBILITY FIX:
         * Laravel hashes start with $2y$. Node.js bcrypt only supports $2a$ or $2b$.
         * We replace the prefix to ensure existing users can log in.
         */
        const dbHash = user.password.replace(/^\$2y\$/, '$2a$');
        const isPasswordValid = await bcrypt.compare(password, dbHash);

        if (isPasswordValid) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...result } = user;
            return { ...result, guard };
        }

        return null;
    }

    login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id.toString(),
            type: user.type,
            guard: user.guard,
            kyc_status: user.kyc_status,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                ...user,
                id: user.id.toString(),
            },
        };
    }

    async requestOtp(email: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { email },
        });
        if (!customer) {
            throw new BadRequestException('Email not found');
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = await bcrypt.hash(code, 10);

        await this.prisma.userLoginOtp.updateMany({
            where: { user_id: customer.id, consumed_at: null },
            data: { consumed_at: new Date() },
        });

        await this.prisma.userLoginOtp.create({
            data: {
                code: hashedCode,
                user_id: customer.id,
                expires_at: new Date(Date.now() + 10 * 60000),
            },
        });

        // In a real app, send the email here.
        console.log(`OTP for ${email}: ${code}`);

        return { message: 'A one-time code has been emailed.' };
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        const { email, code } = verifyOtpDto;
        const customer = await this.prisma.customer.findUnique({
            where: { email },
        });

        if (!customer) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const otp = await this.prisma.userLoginOtp.findFirst({
            where: {
                user_id: customer.id,
                consumed_at: null,
                expires_at: { gte: new Date() },
            },
            orderBy: { created_at: 'desc' },
        });

        if (
            !otp ||
            !(await bcrypt.compare(code, otp.code.replace(/^\$2y\$/, '$2a$')))
        ) {
            throw new UnauthorizedException('Invalid or expired code');
        }

        await this.prisma.userLoginOtp.update({
            where: { id: otp.id },
            data: { consumed_at: new Date() },
        });

        return { ...customer, guard: 'web' };
    }
}
