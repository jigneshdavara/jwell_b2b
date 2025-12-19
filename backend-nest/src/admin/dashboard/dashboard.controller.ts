import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get()
    async getDashboard() {
        return this.dashboardService.getDashboardData();
    }
}
