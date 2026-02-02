import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Get public settings (contact info, studio hours, etc.)
     * This method is used by the frontend footer
     */
    async getPublicSettings() {
        const keys = [
            'company_name',
            'company_phone',
            'company_email',
            'company_address',
            'company_city',
            'company_state',
            'company_pincode',
            'company_gstin',
            'studio_hours',
        ];

        const settings = await this.prisma.settings.findMany({
            where: { key: { in: keys } },
        });

        const settingsMap = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        // Provide defaults if keys are missing
        const defaults = {
            company_name: 'Elvee Jewellery Pvt. Ltd.',
            company_phone: '+91 99888 77665',
            company_email: 'hello@elvee.in',
            company_address: 'Elvee, SEZ Jewellery Park, Mumbai',
            company_city: 'Mumbai',
            company_state: 'Maharashtra',
            company_pincode: '',
            company_gstin: '27AAAAA0000A1Z5',
            studio_hours: 'Mon-Sat, 10:00 - 19:00 IST',
        };

        const finalSettings = { ...defaults, ...settingsMap };

        // Build full address
        const addressParts = [
            finalSettings.company_address,
            finalSettings.company_city,
            finalSettings.company_state,
            finalSettings.company_pincode,
        ].filter(Boolean);

        return {
            company_name: finalSettings.company_name,
            phone: finalSettings.company_phone,
            email: finalSettings.company_email,
            address: addressParts.join(', '),
            address_line1: finalSettings.company_address,
            city: finalSettings.company_city,
            state: finalSettings.company_state,
            pincode: finalSettings.company_pincode,
            gstin: finalSettings.company_gstin,
            studio_hours: finalSettings.studio_hours,
        };
    }
}
