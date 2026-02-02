import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../../common/pricing/pricing.service';

@Injectable()
export class DashboardService {
    constructor(
        private prisma: PrismaService,
        private pricingService: PricingService,
    ) {}

    async getDashboardData(userId: bigint) {
        const [stats, recentOrders, recentProducts, featuredCatalogs] =
            await Promise.all([
                this.getStats(userId),
                this.getRecentOrders(userId),
                this.getRecentProducts(),
                this.getFeaturedCatalogs(),
            ]);

        return {
            stats,
            recentOrders,
            recentProducts,
            featuredCatalogs,
        };
    }

    private async getStats(userId: bigint) {
        const openOrderStatuses = [
            'pending',
            'approved',
            'in_production',
            'quality_check',
            'ready_to_dispatch',
        ];

        const [openOrders, activeOffers] = await Promise.all([
            this.prisma.orders.count({
                where: {
                    user_id: userId,
                    status: {
                        in: openOrderStatuses,
                    },
                },
            }),
            this.prisma.offers.count({
                where: { is_active: true },
            }),
        ]);

        return {
            open_orders: openOrders,
            active_offers: activeOffers,
        };
    }

    private async getRecentOrders(userId: bigint) {
        const orders = await this.prisma.orders.findMany({
            where: { user_id: userId },
            include: {
                order_items: true,
            },
            orderBy: { created_at: 'desc' },
            take: 5,
        });

        return orders.map((order) => ({
            reference: order.reference,
            status: order.status,
            total: parseFloat(order.total_amount.toString()),
            items: order.order_items.length,
            placed_on:
                order.created_at?.toISOString() || new Date().toISOString(),
        }));
    }

    private async getRecentProducts() {
        const products = await this.prisma.products.findMany({
            where: { is_active: true },
            include: {
                product_medias: {
                    orderBy: { display_order: 'asc' },
                },
                product_variants: {
                    include: {
                        product_variant_metals: {
                            include: {
                                metals: true,
                                metal_purities: true,
                                metal_tones: true,
                            },
                        },
                        product_variant_diamonds: {
                            include: {
                                diamonds: true,
                            },
                        },
                    },
                    orderBy: { id: 'asc' },
                },
            },
            orderBy: { created_at: 'desc' },
            take: 6,
        });

        const productsWithPrices = await Promise.all(
            products.map(async (product) => {
                // Get first variant (sorted by id)
                const variant = product.product_variants[0] || null;
                let priceTotal = 0;

                // Prepare product object for PricingService
                const productForPricing = {
                    id: product.id,
                    making_charge_amount: product.making_charge_amount
                        ? parseFloat(product.making_charge_amount.toString())
                        : null,
                    making_charge_percentage: product.making_charge_percentage
                        ? parseFloat(
                              product.making_charge_percentage.toString(),
                          )
                        : null,
                    metadata: (product.metadata as any) || {},
                };

                if (variant) {
                    // Calculate price using PricingService
                    const priceData =
                        await this.pricingService.calculateProductPrice(
                            productForPricing,
                            null, // No user context for dashboard
                            { variant_id: variant.id.toString() },
                        );
                    priceTotal = parseFloat(priceData.total?.toString() || '0');
                } else {
                    // If no variant, calculate making charge only
                    const priceData =
                        await this.pricingService.calculateProductPrice(
                            productForPricing,
                            null,
                            {},
                        );
                    priceTotal = parseFloat(priceData.total?.toString() || '0');
                }

                // Get thumbnail (first media sorted by display_order)
                let thumbnail: string | null = null;
                const firstMedia = product.product_medias[0];
                if (firstMedia && firstMedia.url) {
                    // Check if URL is absolute
                    if (
                        firstMedia.url.startsWith('http://') ||
                        firstMedia.url.startsWith('https://')
                    ) {
                        thumbnail = firstMedia.url;
                    } else if (firstMedia.url.startsWith('/storage/')) {
                        // URL already has /storage/ prefix, use as-is
                        thumbnail = firstMedia.url;
                    } else {
                        // URL is relative, add /storage/ prefix
                        thumbnail = `/storage/${firstMedia.url}`;
                    }
                }

                return {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price_total: priceTotal,
                    thumbnail,
                };
            }),
        );

        return productsWithPrices;
    }

    private async getFeaturedCatalogs() {
        const catalogs = await this.prisma.catalogs.findMany({
            where: { is_active: true },
            include: {
                _count: {
                    select: {
                        catalog_products: true,
                    },
                },
            },
            orderBy: { updated_at: 'desc' },
            take: 6,
        });

        return catalogs.map((catalog) => ({
            id: catalog.id,
            name: catalog.name,
            description: catalog.description,
            products_count: catalog._count.catalog_products,
        }));
    }
}
