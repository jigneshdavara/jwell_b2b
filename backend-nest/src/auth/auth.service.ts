import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../common/mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/otp.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import {
    VerifyEmailDto,
    ResendVerificationDto,
} from './dto/email-verification.dto';
import { ConfirmPasswordDto } from './dto/password-confirm.dto';
import { UserType } from '../admin/admins/dto/admin.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) {}

    async register(registerDto: RegisterDto) {
        const { password, password_confirmation, email, ...rest } = registerDto;

        if (password !== password_confirmation) {
            throw new BadRequestException('Passwords do not match');
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return await this.prisma
            .$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        name: rest.name,
                        email,
                        phone: rest.phone,
                        password: hashedPassword,
                        type: rest.account_type,
                        kyc_status: 'pending',
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
                const { password: _, ...result } = user;
                const userId = Number(user.id);

                // Return result - emails will be sent after transaction commits
                return {
                    ...result,
                    guard: 'user',
                    _userIdForEmail: userId,
                } as any;
            })
            .then((result) => {
                // Send emails AFTER transaction commits (outside transaction)
                // This ensures the user is visible to the main Prisma client
                // Fire-and-forget: don't await emails to avoid blocking the response
                const userId = (result as any)._userIdForEmail;
                if (userId) {
                    // Send emails asynchronously without blocking
                    this.mailService.sendWelcomeEmail(userId).catch(() => {
                        // Silently fail - emails are non-critical
                    });

                    this.mailService
                        .sendAdminNewUserNotification(userId)
                        .catch(() => {
                            // Silently fail - emails are non-critical
                        });
                }

                // Remove the internal field before returning
                const { _userIdForEmail, ...finalResult } = result as any;
                return finalResult;
            });
    }

    async registerAdmin(registerAdminDto: RegisterAdminDto) {
        const {
            password,
            password_confirmation,
            email,
            name,
            type,
            admin_group_id,
        } = registerAdminDto;

        if (password !== password_confirmation) {
            throw new BadRequestException('Passwords do not match');
        }

        // Check if email exists in admins table
        const existingAdmin = await this.prisma.admin.findUnique({
            where: { email },
        });
        if (existingAdmin) {
            throw new ConflictException('Email already registered');
        }

        // Check if email exists in users table
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.admin.create({
            data: {
                name,
                email,
                password: hashedPassword,
                type: type || UserType.ADMIN,
                admin_group_id: admin_group_id ? BigInt(admin_group_id) : null,
                email_verified_at: new Date(),
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...result } = user;
        return { ...result, guard: 'admin' } as any;
    }

    async validateUser(
        loginDto: LoginDto,
        guard: 'admin' | 'user',
    ): Promise<any> {
        const { email, password } = loginDto;

        let user: any;
        if (guard === 'admin') {
            user = await this.prisma.admin.findUnique({ where: { email } });
        } else {
            user = await this.prisma.user.findUnique({ where: { email } });
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
        const payload: any = {
            email: user.email,
            sub: user.id.toString(),
            type: user.type,
            guard: user.guard,
        };

        // Only include kyc_status for regular users, not admins
        if (user.guard === 'user' && user.kyc_status !== undefined) {
            payload.kyc_status = user.kyc_status;
        }

        // Clean up the user object to remove password and ensure consistent structure
        const { password: _, ...userWithoutPassword } = user;

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                ...userWithoutPassword,
                id: user.id.toString(),
            },
        };
    }

    async refreshToken(jwtPayload: any) {
        // Get user data from database based on JWT payload
        // JWT strategy returns userId (not sub), so use that
        const userId = BigInt(jwtPayload.userId || jwtPayload.sub);
        const guard = jwtPayload.guard || 'user';

        let user: any;
        if (guard === 'admin') {
            user = await this.prisma.admin.findUnique({
                where: { id: userId },
            });
        } else {
            user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
        }

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Generate new token with updated user data
        const payload: any = {
            email: user.email,
            sub: user.id.toString(),
            type: user.type,
            guard: guard,
        };

        // Only include kyc_status for regular users, not admins
        if (guard === 'user' && user.kyc_status !== undefined) {
            payload.kyc_status = user.kyc_status;
        }

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async requestOtp(email: string) {
        const customer = await this.prisma.user.findUnique({
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

        // Send OTP email
        try {
            await this.mailService.sendLoginOtp(email, code, '10 minutes');
        } catch (error) {
            // Log the error for debugging
            console.error('Failed to send OTP email:', error);

            // In development, log the code to console
            if (
                process.env.NODE_ENV !== 'production' ||
                process.env.MAIL_MAILER === 'log'
            ) {
                console.log(`OTP for ${email}: ${code}`);
            }

            // If email sending fails, still return success but log the error
            // The OTP is created and can be used even if email fails
            // In production, you might want to throw an error or queue for retry
        }

        return { message: 'A one-time code has been emailed.' };
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        const { email, code } = verifyOtpDto;
        const customer = await this.prisma.user.findUnique({
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

        return { ...customer, guard: 'user' };
    }

    /**
     * Send password reset link
     */
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const { email } = forgotPasswordDto;

        // Try customer first, then admin user
        let user: any = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { email },
            });
        }

        // Always return success to prevent email enumeration
        if (!user) {
            return {
                message:
                    'If that email address exists, we will send a password reset link.',
            };
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(token, 10);

        // Store or update reset token
        await this.prisma.password_reset_tokens.upsert({
            where: { email },
            update: {
                token: hashedToken,
                created_at: new Date(),
            },
            create: {
                email,
                token: hashedToken,
                created_at: new Date(),
            },
        });

        // Send password reset email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}?email=${encodeURIComponent(email)}`;

        try {
            await this.mailService.sendPasswordResetLinkEmail(
                email,
                resetUrl,
                user.name,
            );
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            // In development, log the reset URL
            if (
                process.env.NODE_ENV !== 'production' ||
                process.env.MAIL_MAILER === 'log'
            ) {
                console.log(`Password reset link for ${email}: ${resetUrl}`);
            }
            // Don't throw - always return success to prevent email enumeration
        }

        return {
            message:
                'If that email address exists, we will send a password reset link.',
        };
    }

    /**
     * Reset password using token
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { token, email, password, password_confirmation } =
            resetPasswordDto;

        if (password !== password_confirmation) {
            throw new BadRequestException('Passwords do not match');
        }

        // Find reset token
        const resetToken = await this.prisma.password_reset_tokens.findUnique({
            where: { email },
        });

        if (!resetToken) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        // Check if token is valid (60 minutes expiry)
        if (!resetToken.created_at) {
            throw new UnauthorizedException('Invalid reset token');
        }
        const tokenAge = Date.now() - resetToken.created_at.getTime();
        const tokenExpiry = 60 * 60 * 1000; // 60 minutes

        if (tokenAge > tokenExpiry) {
            await this.prisma.password_reset_tokens.delete({
                where: { email },
            });
            throw new UnauthorizedException('Reset token has expired');
        }

        // Verify token
        const dbHash = resetToken.token.replace(/^\$2y\$/, '$2a$');
        const isTokenValid = await bcrypt.compare(token, dbHash);

        if (!isTokenValid) {
            throw new UnauthorizedException('Invalid reset token');
        }

        // Find user (customer or admin)
        let user: any = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { email },
            });
        }

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Update password
        const hashedPassword = await bcrypt.hash(password, 10);

        if ('kyc_status' in user) {
            // User?
            await this.prisma.user.update({
                where: { email },
                data: { password: hashedPassword },
            });
        } else {
            // Admin user
            await this.prisma.user.update({
                where: { email },
                data: { password: hashedPassword },
            });
        }

        // Delete reset token
        await this.prisma.password_reset_tokens.delete({
            where: { email },
        });

        return {
            message: 'Password has been reset successfully',
        };
    }

    /**
     * Verify email address
     */
    async verifyEmail(verifyEmailDto: VerifyEmailDto) {
        const { id, hash } = verifyEmailDto;

        // Find user by ID
        let user: any = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });

        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { id: BigInt(id) },
            });
        }

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify hash (Laravel uses SHA256 of email)
        const expectedHash = crypto
            .createHash('sha256')
            .update(user.email)
            .digest('hex');

        if (hash !== expectedHash) {
            throw new UnauthorizedException('Invalid verification link');
        }

        // Check if already verified
        if (user.email_verified_at) {
            return {
                message: 'Email already verified',
            };
        }

        // Mark email as verified
        if ('kyc_status' in user) {
            // User?
            await this.prisma.user.update({
                where: { id: BigInt(id) },
                data: { email_verified_at: new Date() },
            });
        } else {
            // Admin user
            await this.prisma.user.update({
                where: { id: BigInt(id) },
                data: { email_verified_at: new Date() },
            });
        }

        return {
            message: 'Email verified successfully',
        };
    }

    /**
     * Resend email verification
     */
    async resendVerification(resendVerificationDto: ResendVerificationDto) {
        const { email } = resendVerificationDto;

        // Find user
        let user: any = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { email },
            });
        }

        if (!user) {
            // Don't reveal if email exists
            return {
                message:
                    'If that email address exists and is not verified, we will send a verification link.',
            };
        }

        // Check if already verified
        if (user.email_verified_at) {
            return {
                message: 'Email is already verified',
            };
        }

        // Generate verification link
        const hash = crypto.createHash('sha256').update(email).digest('hex');
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${user.id.toString()}/${hash}`;

        // Send verification email
        await this.mailService.sendEmailVerification(
            email,
            verificationUrl,
            user.name,
        );

        return {
            message:
                'If that email address exists and is not verified, we will send a verification link.',
        };
    }

    /**
     * Confirm password (for sensitive operations)
     */
    async confirmPassword(
        userId: string,
        guard: 'admin' | 'user',
        confirmPasswordDto: ConfirmPasswordDto,
    ) {
        const { password } = confirmPasswordDto;

        // Find user based on guard
        let user: any;
        if (guard === 'admin') {
            user = await this.prisma.admin.findUnique({
                where: { id: BigInt(userId) },
            });
        } else {
            user = await this.prisma.user.findUnique({
                where: { id: BigInt(userId) },
            });
        }

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify password
        const dbHash = user.password.replace(/^\$2y\$/, '$2a$');
        const isPasswordValid = await bcrypt.compare(password, dbHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid password');
        }

        return {
            message: 'Password confirmed',
        };
    }
}
