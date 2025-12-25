import { BaseSeeder } from './base-seeder';

export class MetalDataSeeder extends BaseSeeder {
    async run(): Promise<void> {
        // Create metals
        const metals = [
            {
                code: 'GOLD',
                name: 'Gold',
                description: 'Pure gold',
                display_order: 1,
            },
            {
                code: 'SILVER',
                name: 'Silver',
                description: 'Pure silver',
                display_order: 2,
            },
            {
                code: 'PLATINUM',
                name: 'Platinum',
                description: 'Pure platinum',
                display_order: 3,
            },
        ];

        const createdMetals: Array<{
            id: bigint;
            code: string;
            name: string;
            description: string | null;
            display_order: number;
            is_active: boolean;
            created_at: Date | null;
            updated_at: Date | null;
        }> = [];
        for (const metal of metals) {
            const existing = await this.prisma.metals.findFirst({
                where: { code: metal.code },
            });

            let created;
            if (existing) {
                created = await this.prisma.metals.update({
                    where: { id: existing.id },
                    data: {
                        name: metal.name,
                        description: metal.description,
                        is_active: true,
                        display_order: metal.display_order,
                    },
                });
            } else {
                created = await this.prisma.metals.create({
                    data: {
                        code: metal.code,
                        name: metal.name,
                        description: metal.description,
                        is_active: true,
                        display_order: metal.display_order,
                    },
                });
            }
            createdMetals.push(created as (typeof createdMetals)[0]);
        }

        this.log(`Seeded ${metals.length} metals`);

        // Create purities for gold
        const gold = createdMetals.find((m) => m.code === 'GOLD');
        if (gold) {
            const purities = [
                { code: '24K', name: '24 Karat', display_order: 1 },
                { code: '22K', name: '22 Karat', display_order: 2 },
                { code: '18K', name: '18 Karat', display_order: 3 },
                { code: '14K', name: '14 Karat', display_order: 4 },
            ];

            for (const purity of purities) {
                await this.prisma.metal_purities.upsert({
                    where: {
                        metal_id_name: {
                            metal_id: gold.id,
                            name: purity.name,
                        },
                    },
                    update: {
                        code: purity.code,
                        is_active: true,
                        display_order: purity.display_order,
                    },
                    create: {
                        metal_id: gold.id,
                        code: purity.code,
                        name: purity.name,
                        is_active: true,
                        display_order: purity.display_order,
                    },
                });
            }

            this.log(`Seeded ${purities.length} gold purities`);
        }

        // Create tones for gold
        if (gold) {
            const tones = [
                { code: 'YELLOW', name: 'Yellow Gold', display_order: 1 },
                { code: 'WHITE', name: 'White Gold', display_order: 2 },
                { code: 'ROSE', name: 'Rose Gold', display_order: 3 },
            ];

            for (const tone of tones) {
                await this.prisma.metal_tones.upsert({
                    where: {
                        metal_id_name: {
                            metal_id: gold.id,
                            name: tone.name,
                        },
                    },
                    update: {
                        code: tone.code,
                        is_active: true,
                        display_order: tone.display_order,
                    },
                    create: {
                        metal_id: gold.id,
                        code: tone.code,
                        name: tone.name,
                        is_active: true,
                        display_order: tone.display_order,
                    },
                });
            }

            this.log(`Seeded ${tones.length} gold tones`);
        }

        // Create purities for silver
        const silver = createdMetals.find((m) => m.code === 'SILVER');
        if (silver) {
            const purities = [
                { code: '925', name: '925 Silver', display_order: 1 },
                { code: '999', name: '999 Silver', display_order: 2 },
            ];

            for (const purity of purities) {
                await this.prisma.metal_purities.upsert({
                    where: {
                        metal_id_name: {
                            metal_id: silver.id,
                            name: purity.name,
                        },
                    },
                    update: {
                        code: purity.code,
                        is_active: true,
                        display_order: purity.display_order,
                    },
                    create: {
                        metal_id: silver.id,
                        code: purity.code,
                        name: purity.name,
                        is_active: true,
                        display_order: purity.display_order,
                    },
                });
            }

            this.log(`Seeded ${purities.length} silver purities`);
        }
    }
}
