import { SetMetadata } from '@nestjs/common';

export const PORTAL_ACCESS_KEY = 'portal_access';
export const PortalAccess = (...roles: string[]) =>
    SetMetadata(PORTAL_ACCESS_KEY, roles);



