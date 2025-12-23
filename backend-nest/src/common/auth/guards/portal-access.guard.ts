import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class PortalAccessGuard implements CanActivate {
    private allowedRoles: string[];

    constructor(...roles: string[]) {
        this.allowedRoles = roles.length > 0 ? roles : ['retailer', 'wholesaler', 'sales'];
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Check if user type is in allowed roles
        const userType = user.type?.toLowerCase();
        const isAllowed = this.allowedRoles.some(
            (role) => role.toLowerCase() === userType,
        );

        if (!isAllowed) {
            throw new ForbiddenException(
                'Access limited to approved retail partners.',
            );
        }

        return true;
    }
}


