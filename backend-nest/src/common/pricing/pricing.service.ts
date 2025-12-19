import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountsService } from '../discounts/discounts.service';

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private discounts: DiscountsService,
  ) {}

  async calculateProductPrice(product: any, user?: any, options: any = {}): Promise<any> {
    const variantId = options.variant_id ?? options.variant?.id ?? null;
    let variantModel: any = null;

    if (variantId) {
      variantModel = await this.prisma.product_variants.findUnique({
        where: { id: BigInt(variantId) },
        include: {
          product_variant_metals: {
            include: { metals: true, metal_purities: true, metal_tones: true },
          },
          product_variant_diamonds: {
            include: { diamonds: true },
          },
        },
      });
    }

    // Calculate metal cost
    let metalCost = 0.0;
    if (variantModel && variantModel.product_variant_metals) {
      for (const variantMetal of variantModel.product_variant_metals) {
        const metal = variantMetal.metals;
        const purity = variantMetal.metal_purities;
        const weight = variantMetal.metal_weight ? parseFloat(variantMetal.metal_weight.toString()) : null;

        if (metal && purity && weight) {
          const metalName = metal.name.toLowerCase().trim();
          const purityName = purity.name.trim();

          const priceRate = await this.prisma.price_rates.findFirst({
            where: {
              metal: metalName,
              purity: purityName,
            },
            orderBy: { effective_at: 'desc' },
          });

          if (priceRate && priceRate.price_per_gram) {
            metalCost += weight * priceRate.price_per_gram.toNumber();
          }
        }
      }
    }
    metalCost = Math.round(metalCost * 100) / 100;

    // Calculate diamond cost
    let diamondCost = 0.0;
    if (variantModel && variantModel.product_variant_diamonds) {
      for (const variantDiamond of variantModel.product_variant_diamonds) {
        const diamond = variantDiamond.diamonds;
        const count = variantDiamond.diamonds_count ?? 1;

        if (diamond && diamond.price) {
          diamondCost += diamond.price.toNumber() * count;
        }
      }
    }
    diamondCost = Math.round(diamondCost * 100) / 100;

    // Calculate making charge
    const making = this.discounts.calculateMakingCharge(product, metalCost);

    // Subtotal
    const unitSubtotal = metalCost + diamondCost + making;
    const quantity = Math.max(1, parseInt(options.quantity || 1));

    const discountContext = {
      ...options,
      quantity,
      unit_subtotal: unitSubtotal,
      line_subtotal: unitSubtotal * quantity,
      metal: metalCost,
      metal_cost: metalCost,
    };

    const discount = await this.discounts.resolve(product, user, discountContext);
    let unitDiscount = Math.round(parseFloat(discount.amount || 0) * 100) / 100;
    unitDiscount = Math.min(unitDiscount, making);
    unitDiscount = Math.max(0.0, unitDiscount);

    const unitTotal = Math.max(0.0, unitSubtotal - unitDiscount);

    return {
      metal: Math.round(metalCost * 100) / 100,
      diamond: Math.round(diamondCost * 100) / 100,
      stones: Math.round(diamondCost * 100) / 100,
      making: Math.round(making * 100) / 100,
      subtotal: Math.round(unitSubtotal * 100) / 100,
      discount: unitDiscount,
      discount_details: discount,
      tax: 0.0,
      total: Math.round(unitTotal * 100) / 100,
    };
  }
}