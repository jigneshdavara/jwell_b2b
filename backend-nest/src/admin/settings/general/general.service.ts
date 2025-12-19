import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateGeneralSettingsDto } from './dto/general-settings.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GeneralSettingsService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        const keys = [
            'admin_email',
            'company_name',
            'company_address',
            'company_city',
            'company_state',
            'company_pincode',
            'company_phone',
            'company_email',
            'company_gstin',
            'logo_path',
            'favicon_path',
            'app_name',
            'app_timezone',
            'app_currency',
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
            admin_email: '',
            company_name: 'Elvee Jewellery Pvt. Ltd.',
            company_address: '',
            company_city: 'Mumbai',
            company_state: 'Maharashtra',
            company_pincode: '',
            company_phone: '+91 99888 77665',
            company_email: 'hello@elvee.in',
            company_gstin: '27AAAAA0000A1Z5',
            logo_path: '',
            favicon_path: '',
            app_name: 'Elvee B2B',
            app_timezone: 'Asia/Kolkata',
            app_currency: 'INR',
        };

        const finalSettings = { ...defaults, ...settingsMap };

        return {
            ...finalSettings,
            logo_url: finalSettings.logo_path
                ? `/storage/${finalSettings.logo_path}`
                : null,
            favicon_url: finalSettings.favicon_path
                ? `/storage/${finalSettings.favicon_path}`
                : null,
        };
    }

    async update(
        dto: UpdateGeneralSettingsDto,
        logo?: string,
        favicon?: string,
    ) {
        const updates = Object.entries(dto).map(([key, value]) => {
            return this.set(key, value as string);
        });

        if (logo) {
            updates.push(this.set('logo_path', logo));
        }

        if (favicon) {
            updates.push(this.set('favicon_path', favicon));
        }

        await Promise.all(updates);

        return { message: 'Settings updated successfully' };
    }

    private async set(
        key: string,
        value: string,
        type: string = 'string',
        group: string = 'general',
    ) {
        const existing = await this.prisma.settings.findUnique({
            where: { key },
        });

        if (existing) {
            // If updating a file path, we might want to delete the old one
            if (
                (key === 'logo_path' || key === 'favicon_path') &&
                existing.value &&
                existing.value !== value
            ) {
                this.deleteFile(existing.value);
            }

            return this.prisma.settings.update({
                where: { key },
                data: { value, updated_at: new Date() },
            });
        } else {
            return this.prisma.settings.create({
                data: {
                    key,
                    value,
                    type,
                    group,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }
    }

    private deleteFile(filePath: string) {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
            } catch (err) {
                console.error(
                    `Failed to delete setting file: ${fullPath}`,
                    err,
                );
            }
        }
    }
}
