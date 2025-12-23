import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    async getMetrics() {
        const [pendingKyc, ordersInProduction, activeOffers] =
            await Promise.all([
                this.prisma.user.count({
                    where: { kyc_status: 'pending' },
                }),
                this.prisma.orders.count({
                    where: {
                        status: {
                            in: [
                                'in_production',
                                'quality_check',
                                'ready_to_dispatch',
                            ],
                        },
                    },
                }),
                this.prisma.offers.count({
                    where: { is_active: true },
                }),
            ]);

        return {
            pending_kyc: pendingKyc,
            orders_in_production: ordersInProduction,
            active_offers: activeOffers,
        };
    }

    async getRecentPartners() {
        const customers = await this.prisma.user.findMany({
            orderBy: { created_at: 'desc' },
            take: 6,
            select: {
                id: true,
                name: true,
                email: true,
                type: true,
                kyc_status: true,
                created_at: true,
            },
        });

        return customers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.type,
            kyc_status: user.kyc_status,
            joined_at: user.created_at,
        }));
    }

    async getDashboardData() {
        const [metrics, recentPartners] = await Promise.all([
            this.getMetrics(),
            this.getRecentPartners(),
        ]);

        return {
            metrics,
            recentPartners,
        };
    }
}
