import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMetalRatesDto } from './dto/rate.dto';

@Injectable()
export class RatesService {
    constructor(private prisma: PrismaService) {}

    private readonly PURITY_ORDER = {
        gold: ['24K', '22K', '18K', '14K'],
        silver: ['999', '958', '925'],
    };

    async findAll(page: number = 1, perPage: number = 10) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.price_rates.findMany({
                skip,
                take: perPage,
                orderBy: { effective_at: 'desc' },
            }),
            this.prisma.price_rates.count(),
        ]);

        // Get available metals and their purities for the summary
        const availableMetals = await this.prisma.metals.findMany({
            where: { is_active: true },
            orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            include: {
                metal_purities: {
                    where: { is_active: true },
                    orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
                },
            },
        });

        const metalSummaries = {};
        for (const metal of availableMetals) {
            const metalValue = metal.name.toLowerCase();
            metalSummaries[metalValue] =
                await this.buildMetalSummary(metalValue);
        }

        return {
            items: items.map((item) => ({
                ...item,
                id: Number(item.id),
            })),
            defaultCurrency: 'INR',
            availableMetals: availableMetals.map((m) => ({
                id: Number(m.id),
                name: m.name,
                slug: m.name.toLowerCase(),
                value: m.name.toLowerCase(),
            })),
            metalPurities: availableMetals.reduce((acc, m) => {
                acc[m.name.toLowerCase()] = m.metal_purities.map((p) => ({
                    id: Number(p.id),
                    name: p.name,
                    slug: p.name.toLowerCase(),
                }));
                return acc;
            }, {}),
            metalSummaries,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    private async buildMetalSummary(metal: string) {
        const rates = await this.prisma.price_rates.findMany({
            where: { metal: { equals: metal, mode: 'insensitive' } },
            orderBy: { effective_at: 'desc' },
        });

        if (rates.length === 0) {
            return {
                metal,
                label: metal.charAt(0).toUpperCase() + metal.slice(1),
                latest: null,
                rates: [],
            };
        }

        const latest = rates[0];

        // Get latest rate per purity
        const puritiesSeen = new Set<string>();
        const latestByPurity: typeof rates = [];

        for (const rate of rates) {
            if (rate.purity && !puritiesSeen.has(rate.purity)) {
                puritiesSeen.add(rate.purity);
                latestByPurity.push(rate);
            }
        }

        // Sort by purity order
        const metalKey = metal.toLowerCase() as keyof typeof this.PURITY_ORDER;
        const order = this.PURITY_ORDER[metalKey] || [];
        latestByPurity.sort((a, b) => {
            const purityA = a.purity || '';
            const purityB = b.purity || '';
            const indexA = order.indexOf(purityA);
            const indexB = order.indexOf(purityB);
            const valA = indexA === -1 ? 999 : indexA;
            const valB = indexB === -1 ? 999 : indexB;
            return valA - valB;
        });

        return {
            metal,
            label: metal.charAt(0).toUpperCase() + metal.slice(1),
            latest: {
                purity: latest.purity,
                price_per_gram: Number(latest.price_per_gram),
                currency: latest.currency,
                effective_at: latest.effective_at
                    ? latest.effective_at.toISOString()
                    : null,
                source: latest.source,
            },
            rates: latestByPurity.map((r) => ({
                purity: r.purity,
                price_per_gram: Number(r.price_per_gram),
                currency: r.currency,
            })),
        };
    }

    async sync(metal?: string): Promise<{ success: boolean; message: string }> {
        // TODO: Implement actual rate syncing from external API
        // For now, return success
        await Promise.resolve(); // Placeholder for async operation
        return {
            success: true,
            message: metal ? `Synced ${metal} rates` : 'Synced all rates',
        };
    }

    async storeMetalRates(metal: string, dto: UpdateMetalRatesDto) {
        return await this.prisma.$transaction(async (tx) => {
            const rates: Array<{
                id: number;
                metal: string;
                purity: string | null;
                price_per_gram: number;
                currency: string;
                source: string;
                effective_at: Date | null;
            }> = [];
            for (const rate of dto.rates) {
                const created = await tx.price_rates.create({
                    data: {
                        metal: metal.toLowerCase(),
                        purity: rate.purity,
                        price_per_gram: rate.price_per_gram,
                        currency: rate.currency || dto.currency || 'INR',
                        source: dto.source || 'manual',
                        effective_at: dto.effective_at
                            ? new Date(dto.effective_at)
                            : new Date(),
                    },
                });
                rates.push({
                    id: Number(created.id),
                    metal: created.metal,
                    purity: created.purity,
                    price_per_gram: Number(created.price_per_gram),
                    currency: created.currency,
                    source: created.source,
                    effective_at: created.effective_at,
                });
            }
            return rates;
        });
    }
}
