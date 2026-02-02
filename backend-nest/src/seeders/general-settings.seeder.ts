import { BaseSeeder } from './base-seeder';

export class GeneralSettingsSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const settings = [
            // General settings
            {
                key: 'app_name',
                value: 'Elvee B2B',
                type: 'string',
                group: 'general',
            },
            {
                key: 'app_timezone',
                value: 'Asia/Kolkata',
                type: 'string',
                group: 'general',
            },
            {
                key: 'app_currency',
                value: 'INR',
                type: 'string',
                group: 'general',
            },
            {
                key: 'logo_path',
                value: '',
                type: 'string',
                group: 'general',
            },
            {
                key: 'favicon_path',
                value: '',
                type: 'string',
                group: 'general',
            },

            // Company settings
            {
                key: 'company_name',
                value: 'Elvee Jewellery Pvt. Ltd.',
                type: 'string',
                group: 'company',
            },
            {
                key: 'company_address',
                value: 'M1- M6, Gujarat Hira Bourse, Gem & Jewellery Park Pal, Road, Ichchhapor, Hazira',
                type: 'string',
                group: 'company',
            },
            {
                key: 'company_city',
                value: 'Surat',
                type: 'string',
                group: 'company',
            },
            {
                key: 'company_state',
                value: 'Gujarat',
                type: 'string',
                group: 'company',
            },
            {
                key: 'company_pincode',
                value: '394510',
                type: 'string',
                group: 'company',
            },
            {
                key: 'company_phone',
                value: '+91 261 610 5100',
                type: 'string',
                group: 'company',
            },
            {
                key: 'company_email',
                value: 'info@elvee.in',
                type: 'string',
                group: 'company',
            },
            {
                key: 'company_gstin',
                value: '27AAAAA0000A1Z5',
                type: 'string',
                group: 'company',
            },

            // Email settings
            {
                key: 'admin_email',
                value: 'info@titliya.com',
                type: 'string',
                group: 'email',
            },
        ];

        for (const setting of settings) {
            await this.prisma.settings.upsert({
                where: { key: setting.key },
                update: {
                    value: setting.value,
                    type: setting.type,
                    group: setting.group,
                },
                create: {
                    key: setting.key,
                    value: setting.value,
                    type: setting.type,
                    group: setting.group,
                },
            });
        }

        this.log(`Seeded ${settings.length} general settings`);
    }
}
