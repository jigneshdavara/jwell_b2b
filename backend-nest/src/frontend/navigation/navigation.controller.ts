import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';

@Controller('navigation')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class NavigationController {
    constructor(private readonly navigationService: NavigationService) {}

    @Get()
    async getNavigation(@Request() req) {
        return this.navigationService.getNavigation();
    }
}
