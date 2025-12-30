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
            'studio_hours',
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
            admin_email: 'info@titliya.com',
            company_name: 'Elvee Jewellery Pvt. Ltd.',
            company_address:
                'M1- M6, Gujarat Hira Bourse, Gem & Jewellery Park Pal, Road, Ichchhapor, Hazira',
            company_city: 'Surat',
            company_state: 'Gujarat',
            company_pincode: '394510',
            company_phone: '+91 261 610 5100',
            company_email: 'hello@elvee.in',
            company_gstin: '27AAAAA0000A1Z5',
            studio_hours: 'Mon-Sat, 10:00 - 19:00 IST',
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
                ? finalSettings.logo_path.startsWith('storage/')
                    ? `/${finalSettings.logo_path}`
                    : `/storage/${finalSettings.logo_path}`
                : null,
            favicon_url: finalSettings.favicon_path
                ? finalSettings.favicon_path.startsWith('storage/')
                    ? `/${finalSettings.favicon_path}`
                    : `/storage/${finalSettings.favicon_path}`
                : null,
        };
    }

    async update(
        dto: UpdateGeneralSettingsDto,
        logo?: string | null,
        favicon?: string | null,
    ) {
        // Get text fields from dto (already cleaned in controller, no flags here)
        const updates = Object.entries(dto).map(([key, value]) => {
            return this.set(key, String(value));
        });

        // Handle logo: if path provided (string), set it; if null, remove it; if undefined, don't update
        if (logo !== undefined) {
            if (logo === null) {
                // Remove logo: delete old file and set to null
                const existing = await this.prisma.settings.findUnique({
                    where: { key: 'logo_path' },
                });
                if (existing?.value) {
                    this.deleteFile(existing.value);
                }
                updates.push(this.set('logo_path', ''));
            } else {
                // New logo uploaded: delete old file if exists, then set new path
                const existing = await this.prisma.settings.findUnique({
                    where: { key: 'logo_path' },
                });
                if (existing?.value && existing.value !== logo) {
                    this.deleteFile(existing.value);
                }
                updates.push(this.set('logo_path', logo));
            }
        }

        // Handle favicon: if path provided (string), set it; if null, remove it; if undefined, don't update
        if (favicon !== undefined) {
            if (favicon === null) {
                // Remove favicon: delete old file and set to null
                const existing = await this.prisma.settings.findUnique({
                    where: { key: 'favicon_path' },
                });
                if (existing?.value) {
                    this.deleteFile(existing.value);
                }
                updates.push(this.set('favicon_path', ''));
            } else {
                // New favicon uploaded: delete old file if exists, then set new path
                const existing = await this.prisma.settings.findUnique({
                    where: { key: 'favicon_path' },
                });
                if (existing?.value && existing.value !== favicon) {
                    this.deleteFile(existing.value);
                }
                updates.push(this.set('favicon_path', favicon));
            }
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
