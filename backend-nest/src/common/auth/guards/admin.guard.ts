import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check if user is authenticated
        if (!user) {
            throw new UnauthorizedException('Authentication required');
        }

        // Check if user is admin or super-admin
        const userType = user.type?.toLowerCase();
        const isAdmin = userType === 'admin' || userType === 'super-admin';

        if (!isAdmin) {
            throw new ForbiddenException(
                'Access denied. Admin privileges required.',
            );
        }

        return true;
    }
}
