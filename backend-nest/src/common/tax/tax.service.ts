import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaxService {
    constructor(private prisma: PrismaService) {}

    async getDefaultTaxRate(): Promise<number> {
        // 1. Check settings first
        const setting = await this.prisma.settings.findUnique({
            where: { key: 'default_tax_rate' },
        });

        if (setting && setting.value) {
            const rate = parseFloat(setting.value);
            if (!isNaN(rate)) {
                return rate;
            }
        }

        // 2. Get first active tax
        const tax = await this.prisma.taxes.findFirst({
            where: { is_active: true },
            orderBy: { id: 'asc' },
        });

        if (tax) {
            return tax.rate.toNumber();
        }

        // 3. Default to 18% GST (India)
        return 18.0;
    }

    async calculateTax(subtotal: number, taxRate?: number): Promise<number> {
        const rate = taxRate ?? (await this.getDefaultTaxRate());

        if (rate <= 0) {
            return 0.0;
        }

        return Math.round(((subtotal * rate) / 100) * 100) / 100;
    }
}
