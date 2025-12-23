import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtUser {
    userId?: string;
    sub?: string;
    id?: string;
    email?: string;
    type?: string;
    guard?: string;
    kycStatus?: string;
}

@Injectable()
export class KycApprovedGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user: JwtUser | undefined = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Only enforce KYC for customers (not admin users)
        const userType = (user.type || '').toLowerCase();
        const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(
            userType,
        );

        if (!isCustomer) {
            // Admin users don't need KYC approval
            return true;
        }

        // Fetch latest KYC status from database (not from JWT token)
        // This ensures we get the most up-to-date status even if admin just approved
        const userIdStr = user.userId || user.sub || user.id;
        if (!userIdStr) {
            throw new ForbiddenException('User ID not found in token');
        }

        const userId = BigInt(userIdStr);
        const customer = (await this.prisma.user.findUnique({
            where: { id: userId },
            select: { kyc_status: true, type: true } as any,
        })) as { kyc_status: string; type: string } | null;

        if (!customer) {
            throw new ForbiddenException('Customer not found');
        }

        // Check KYC status from database
        const kycStatus = customer.kyc_status;

        if (kycStatus !== 'approved') {
            throw new ForbiddenException({
                message:
                    'Your KYC is not approved. Please complete the onboarding process.',
                kycStatus: kycStatus,
                error: 'KYC_NOT_APPROVED',
            });
        }

        return true;
    }
}
