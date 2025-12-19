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

  async findAll(page: number = 1, perPage: number = 20) {
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
      metalSummaries[metalValue] = await this.buildMetalSummary(metalValue);
    }

    return {
      items,
      availableMetals: availableMetals.map(m => ({
        id: m.id,
        name: m.name,
        value: m.name.toLowerCase(),
      })),
      metalPurities: availableMetals.reduce((acc, m) => {
        acc[m.name.toLowerCase()] = m.metal_purities.map(p => ({
          id: p.id,
          name: p.name,
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

  async storeMetalRates(metal: string, dto: UpdateMetalRatesDto) {
    const normalizedMetal = metal.toLowerCase();
    const currency = dto.currency?.toUpperCase() || 'INR';

    const updates = dto.rates
      .filter(r => r.purity && r.price_per_gram > 0)
      .map(r => {
        return this.prisma.price_rates.upsert({
          where: {
            // PriceRate doesn't have a unique constraint on metal+purity in schema, 
            // but Laravel used updateOrCreate. We'll find and update or create.
            id: -1n // Placeholder, we'll use findFirst
          },
          create: {
            metal: normalizedMetal,
            purity: r.purity,
            price_per_gram: r.price_per_gram,
            currency,
            source: 'manual',
            metadata: { origin: 'manual' },
            effective_at: new Date(),
          },
          update: {
            price_per_gram: r.price_per_gram,
            currency,
            source: 'manual',
            metadata: { origin: 'manual' },
            effective_at: new Date(),
          }
        });
      });

    // Actually, upsert needs a unique field. Since we don't have a unique constraint on metal+purity in schema, 
    // we have to do it manually.
    for (const r of dto.rates) {
      if (!r.purity || r.price_per_gram <= 0) continue;

      const existing = await this.prisma.price_rates.findFirst({
        where: {
          metal: normalizedMetal,
          purity: r.purity,
        },
        orderBy: { effective_at: 'desc' },
      });

      if (existing) {
        await this.prisma.price_rates.update({
          where: { id: existing.id },
          data: {
            price_per_gram: r.price_per_gram,
            currency,
            source: 'manual',
            metadata: { origin: 'manual' },
            effective_at: new Date(),
          },
        });
      } else {
        await this.prisma.price_rates.create({
          data: {
            metal: normalizedMetal,
            purity: r.purity,
            price_per_gram: r.price_per_gram,
            currency,
            source: 'manual',
            metadata: { origin: 'manual' },
            effective_at: new Date(),
          },
        });
      }
    }

    return { message: `${metal} rates saved successfully.` };
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
    const puritiesSeen = new Set();
    const latestByPurity: typeof rates = [];
    
    for (const rate of rates) {
      if (!puritiesSeen.has(rate.purity)) {
        puritiesSeen.add(rate.purity);
        latestByPurity.push(rate);
      }
    }

    // Sort by purity order
    const order = this.PURITY_ORDER[metal.toLowerCase()] || [];
    latestByPurity.sort((a, b) => {
      const indexA = order.indexOf(a.purity);
      const indexB = order.indexOf(b.purity);
      const valA = indexA === -1 ? 999 : indexA;
      const valB = indexB === -1 ? 999 : indexB;
      return valA - valB;
    });

    return {
      metal,
      label: metal.charAt(0).toUpperCase() + metal.slice(1),
      latest: {
        purity: latest.purity,
        price_per_gram: latest.price_per_gram,
        currency: latest.currency,
        effective_at: latest.effective_at,
        source: latest.source,
      },
      rates: latestByPurity.map(r => ({
        purity: r.purity,
        price_per_gram: r.price_per_gram,
        currency: r.currency,
      })),
    };
  }
}
