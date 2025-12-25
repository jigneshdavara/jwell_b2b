import { BaseSeeder } from './base-seeder';

export class GeneralSettingsSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const settings = [
            {
                key: 'site_name',
                value: 'Jwell B2B Platform',
                type: 'string',
                group: 'general',
            },
            {
                key: 'site_email',
                value: 'info@jwellb2b.com',
                type: 'string',
                group: 'general',
            },
            {
                key: 'site_phone',
                value: '+91-1234567890',
                type: 'string',
                group: 'general',
            },
            {
                key: 'currency',
                value: 'INR',
                type: 'string',
                group: 'general',
            },
            {
                key: 'tax_enabled',
                value: 'true',
                type: 'boolean',
                group: 'general',
            },
            {
                key: 'default_tax_rate',
                value: '18',
                type: 'number',
                group: 'general',
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
