import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HomeResponseDto } from './dto/home.dto';
@Injectable()
export class HomeService {
    constructor(private prisma: PrismaService) {}

    async getHomeData(): Promise<HomeResponseDto> {
        // Get stats
        const [productsCount, ordersCount, activeOffersCount] =
            await Promise.all([
                this.prisma.products.count(),
                this.prisma.orders.count(),
                this.prisma.offers.count({
                    where: { is_active: true },
                }),
            ]);

        // Get spotlight products (3 latest)
        const spotlightProducts = await this.prisma.products.findMany({
            take: 3,
            orderBy: { created_at: 'desc' },
            include: {
                product_medias: {
                    orderBy: { display_order: 'asc' },
                    take: 1,
                },
                product_variants: {
                    take: 1,
                    orderBy: { id: 'asc' },
                    include: {
                        product_variant_metals: {
                            include: {
                                metals: true,
                                metal_purities: true,
                                metal_tones: true,
                            },
                        },
                        product_variant_diamonds: {
                            include: { diamonds: true },
                        },
                    },
                },
            },
        });

        // Format spotlight products (no price calculation needed, just return base_price and making charge info)
        const spotlight = spotlightProducts.map((product) => {
            const productAny = product as any;

            // Get making charge types from metadata or infer from fields
            const makingChargeTypes: string[] = [];
            if (
                product.metadata &&
                typeof product.metadata === 'object' &&
                'making_charge_types' in product.metadata
            ) {
                makingChargeTypes.push(
                    ...(product.metadata as any).making_charge_types,
                );
            } else {
                // Infer from fields (backward compatibility)
                if (productAny.making_charge_amount) {
                    makingChargeTypes.push('fixed');
                }
                if (productAny.making_charge_percentage) {
                    makingChargeTypes.push('percentage');
                }
            }

            return {
                id: product.id.toString(),
                name: product.name,
                price: productAny.base_price
                    ? parseFloat(productAny.base_price.toString())
                    : null,
                making_charge_amount: productAny.making_charge_amount
                    ? parseFloat(productAny.making_charge_amount.toString())
                    : null,
                making_charge_percentage: productAny.making_charge_percentage
                    ? parseFloat(
                          productAny.making_charge_percentage.toString(),
                      )
                    : null,
                making_charge_types: makingChargeTypes,
            };
        });

        // Get features (hardcoded)
        const features = [
            {
                title: 'Live Bullion & Diamond Pricing',
                description:
                    'Lock rates in seconds with automated hedging notifications and daily market snapshots.',
            },
            {
                title: 'Collaborative Jobwork',
                description:
                    'Track incoming material, production stages, QC, and dispatch in one shared workflow.',
            },
            {
                title: 'Personalised Offers',
                description:
                    'Segment retailers vs wholesalers, push promotions, and monitor ROI on every campaign.',
            },
        ];

        // Get brands (active brands ordered by display_order and name)
        const brands = await this.prisma.brands.findMany({
            where: { is_active: true },
            orderBy: [
                { display_order: 'asc' },
                { name: 'asc' },
            ],
            select: { name: true },
        });

        return {
            stats: {
                products: productsCount,
                orders: ordersCount,
                active_offers: activeOffersCount,
            },
            spotlight,
            features,
            brands: brands.map((b) => b.name),
        };
    }
}

