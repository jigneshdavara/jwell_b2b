import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    async getDashboard(@Request() req) {
        const userId = BigInt(req.user.userId);
        return this.dashboardService.getDashboardData(userId);
    }
}
