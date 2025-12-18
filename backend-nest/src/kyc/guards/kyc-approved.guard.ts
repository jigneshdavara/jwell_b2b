import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class KycApprovedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is a customer and if their KYC is approved
    // In our register logic, we attached the customer data to the user object in the JWT payload or we can fetch it.
    // However, the JWT strategy usually just returns the payload.
    // We should ensure the JWT payload includes kyc_status or we fetch it here.
    
    // For now, let's assume kyc_status is in the request user object 
    // (We might need to update the JWT Strategy to include this from the DB)
    
    if (user.kycStatus !== 'approved') {
      throw new ForbiddenException({
        message: 'Your KYC is not approved. Please complete the onboarding process.',
        kycStatus: user.kycStatus,
        error: 'KYC_NOT_APPROVED',
      });
    }

    return true;
  }
}

