import { BaseSeeder } from './base-seeder';

export class MetalDataSeeder extends BaseSeeder {
    async run(): Promise<void> {
        await this.seedMetals();
        await this.seedMetalTones();
        await this.seedMetalPurities();
    }

    protected async seedMetals(): Promise<void> {
        this.log('Seeding metals...');

        const metals = [
            {
                code: 'AU',
                name: 'Gold',
                description: null,
                display_order: 1,
            },
            {
                code: 'AG',
                name: 'Silver',
                description: null,
                display_order: 2,
            },
            {
                code: 'PT',
                name: 'Platinum',
                description: null,
                display_order: 3,
            },
        ];

        for (const metal of metals) {
            const existing = await this.prisma.metals.findFirst({
                where: { name: metal.name },
            });

            if (existing) {
                await this.prisma.metals.update({
                    where: { id: existing.id },
                    data: {
                        code: metal.code,
                        description: metal.description,
                        is_active: true,
                        display_order: metal.display_order,
                    },
                });
            } else {
                await this.prisma.metals.create({
                    data: {
                        code: metal.code,
                        name: metal.name,
                        description: metal.description,
                        is_active: true,
                        display_order: metal.display_order,
                    },
                });
            }
        }

        this.log(`Imported ${metals.length} metals.`);
    }

    protected async seedMetalTones(): Promise<void> {
        this.log('Seeding metal tones...');

        // Get metals
        const gold = await this.prisma.metals.findFirst({
            where: { name: 'Gold' },
        });
        const silver = await this.prisma.metals.findFirst({
            where: { name: 'Silver' },
        });
        const platinum = await this.prisma.metals.findFirst({
            where: { name: 'Platinum' },
        });

        if (!gold || !silver || !platinum) {
            this.log('Metals must be seeded before tones.');
            return;
        }

        const tones = [
            // Gold tones
            { metal_id: gold.id, code: 'Y', name: 'Yellow Gold', display_order: 1 },
            { metal_id: gold.id, code: 'P', name: 'Rose Gold', display_order: 2 },
            { metal_id: gold.id, code: 'W', name: 'White Gold', display_order: 3 },
            {
                metal_id: gold.id,
                code: 'Y-W',
                name: 'Yellow & White Gold',
                display_order: 4,
            },
            {
                metal_id: gold.id,
                code: 'P-W',
                name: 'Rose & White gold',
                display_order: 5,
            },
            {
                metal_id: gold.id,
                code: 'P-W-Y',
                name: 'Rose & White & Yellow Gold',
                display_order: 6,
            },
            {
                metal_id: gold.id,
                code: 'YW',
                name: 'Yellow/White Gold',
                display_order: 7,
            },
            { metal_id: gold.id, code: 'PW', name: 'Rose/White Gold', display_order: 8 },
            {
                metal_id: gold.id,
                code: 'PW-Y',
                name: 'Rose/White & Yellow Gold',
                display_order: 9,
            },
            {
                metal_id: gold.id,
                code: 'YW-P',
                name: 'Yellow/White & Rose Gold',
                display_order: 10,
            },
            {
                metal_id: gold.id,
                code: 'P-Y',
                name: 'Rose & Yellow Gold',
                display_order: 11,
            },
            {
                metal_id: gold.id,
                code: 'PW-YW',
                name: 'Rose/White & Yellow/White Gold',
                display_order: 12,
            },
            { metal_id: gold.id, code: 'MIX', name: 'Mixed Gold', display_order: 13 },
            {
                metal_id: gold.id,
                code: 'YW-W',
                name: 'Yellow/White & White Gold',
                display_order: 14,
            },
            {
                metal_id: gold.id,
                code: 'PW-W',
                name: 'Pink/White & White Gold',
                display_order: 15,
            },
            // Silver tones
            { metal_id: silver.id, code: 'SL', name: 'Silver', display_order: 1 },
            {
                metal_id: silver.id,
                code: 'OX',
                name: 'Oxidized Silver',
                display_order: 2,
            },
            // Platinum tones
            { metal_id: platinum.id, code: 'PT', name: 'Platinum', display_order: 1 },
        ];

        for (const tone of tones) {
            const existing = await this.prisma.metal_tones.findFirst({
                where: {
                    metal_id: tone.metal_id,
                    name: tone.name,
                },
            });

            if (existing) {
                await this.prisma.metal_tones.update({
                    where: { id: existing.id },
                    data: {
                        code: tone.code,
                        is_active: true,
                        display_order: tone.display_order,
                    },
                });
            } else {
                await this.prisma.metal_tones.create({
                    data: {
                        metal_id: tone.metal_id,
                        code: tone.code,
                        name: tone.name,
                        is_active: true,
                        display_order: tone.display_order,
                    },
                });
            }
        }

        this.log(`Imported ${tones.length} metal tones.`);
    }

    protected async seedMetalPurities(): Promise<void> {
        this.log('Seeding metal purities...');

        // Get metals
        const gold = await this.prisma.metals.findFirst({
            where: { name: 'Gold' },
        });
        const silver = await this.prisma.metals.findFirst({
            where: { name: 'Silver' },
        });
        const platinum = await this.prisma.metals.findFirst({
            where: { name: 'Platinum' },
        });

        if (!gold || !silver || !platinum) {
            this.log('Metals must be seeded before purities.');
            return;
        }

        const purities = [
            // Gold purities
            { metal_id: gold.id, code: '18K', name: '18K', display_order: 1 },
            { metal_id: gold.id, code: '22K', name: '22K', display_order: 2 },
            { metal_id: gold.id, code: '24K', name: '24K', display_order: 3 },
            // Silver purities
            { metal_id: silver.id, code: '925', name: '925', display_order: 1 },
            { metal_id: silver.id, code: '999', name: '999', display_order: 2 },
            // Platinum purities
            { metal_id: platinum.id, code: '950', name: '950', display_order: 1 },
        ];

        for (const purity of purities) {
            const existing = await this.prisma.metal_purities.findFirst({
                where: {
                    metal_id: purity.metal_id,
                    name: purity.name,
                },
            });

            if (existing) {
                await this.prisma.metal_purities.update({
                    where: { id: existing.id },
                    data: {
                        code: purity.code,
                        is_active: true,
                        display_order: purity.display_order,
                    },
                });
            } else {
                await this.prisma.metal_purities.create({
                    data: {
                        metal_id: purity.metal_id,
                        code: purity.code,
                        name: purity.name,
                        is_active: true,
                        display_order: purity.display_order,
                    },
                });
            }
        }

        this.log(`Imported ${purities.length} metal purities.`);
    }
}
