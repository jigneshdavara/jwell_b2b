import { BaseSeeder } from './base-seeder';

export class DiamondDataSeeder extends BaseSeeder {
    async run(): Promise<void> {
        // Create diamond types
        const diamondTypes = [
            {
                code: 'NATURAL',
                name: 'Natural Diamond',
                description: 'Natural diamonds',
                display_order: 1,
            },
            {
                code: 'LAB_GROWN',
                name: 'Lab Grown Diamond',
                description: 'Lab grown diamonds',
                display_order: 2,
            },
        ];

        const createdTypes: Array<{
            id: bigint;
            code: string;
            name: string;
            description: string | null;
            display_order: number;
            is_active: boolean;
            created_at: Date | null;
            updated_at: Date | null;
        }> = [];
        for (const type of diamondTypes) {
            const existing = await this.prisma.diamond_types.findFirst({
                where: { code: type.code },
            });

            let created;
            if (existing) {
                created = await this.prisma.diamond_types.update({
                    where: { id: existing.id },
                    data: {
                        name: type.name,
                        description: type.description,
                        is_active: true,
                        display_order: type.display_order,
                    },
                });
            } else {
                created = await this.prisma.diamond_types.create({
                    data: {
                        code: type.code,
                        name: type.name,
                        description: type.description,
                        is_active: true,
                        display_order: type.display_order,
                    },
                });
            }
            createdTypes.push(created as (typeof createdTypes)[0]);
        }

        this.log(`Seeded ${diamondTypes.length} diamond types`);

        // Create diamond shapes for natural diamonds
        const naturalType = createdTypes.find((t) => t.code === 'NATURAL');
        if (naturalType) {
            const shapes = [
                { code: 'ROUND', name: 'Round', display_order: 1 },
                { code: 'PRINCESS', name: 'Princess', display_order: 2 },
                { code: 'EMERALD', name: 'Emerald', display_order: 3 },
                { code: 'CUSHION', name: 'Cushion', display_order: 4 },
                { code: 'OVAL', name: 'Oval', display_order: 5 },
            ];

            for (const shape of shapes) {
                const existing = await this.prisma.diamond_shapes.findFirst({
                    where: {
                        diamond_type_id: naturalType.id,
                        code: shape.code,
                    },
                });

                if (existing) {
                    await this.prisma.diamond_shapes.update({
                        where: { id: existing.id },
                        data: {
                            name: shape.name,
                            is_active: true,
                            display_order: shape.display_order,
                        },
                    });
                } else {
                    await this.prisma.diamond_shapes.create({
                        data: {
                            diamond_type_id: naturalType.id,
                            code: shape.code,
                            name: shape.name,
                            is_active: true,
                            display_order: shape.display_order,
                        },
                    });
                }
            }

            this.log(`Seeded ${shapes.length} diamond shapes`);
        }

        // Create diamond colors
        if (naturalType) {
            const colors = [
                { code: 'D', name: 'D (Colorless)', display_order: 1 },
                { code: 'E', name: 'E (Colorless)', display_order: 2 },
                { code: 'F', name: 'F (Colorless)', display_order: 3 },
                { code: 'G', name: 'G (Near Colorless)', display_order: 4 },
                { code: 'H', name: 'H (Near Colorless)', display_order: 5 },
            ];

            for (const color of colors) {
                const existing = await this.prisma.diamond_colors.findFirst({
                    where: {
                        diamond_type_id: naturalType.id,
                        code: color.code,
                    },
                });

                if (existing) {
                    await this.prisma.diamond_colors.update({
                        where: { id: existing.id },
                        data: {
                            name: color.name,
                            is_active: true,
                            display_order: color.display_order,
                        },
                    });
                } else {
                    await this.prisma.diamond_colors.create({
                        data: {
                            diamond_type_id: naturalType.id,
                            code: color.code,
                            name: color.name,
                            is_active: true,
                            display_order: color.display_order,
                        },
                    });
                }
            }

            this.log(`Seeded ${colors.length} diamond colors`);
        }

        // Create diamond clarities
        if (naturalType) {
            const clarities = [
                { code: 'FL', name: 'Flawless', display_order: 1 },
                { code: 'IF', name: 'Internally Flawless', display_order: 2 },
                { code: 'VVS1', name: 'VVS1', display_order: 3 },
                { code: 'VVS2', name: 'VVS2', display_order: 4 },
                { code: 'VS1', name: 'VS1', display_order: 5 },
                { code: 'VS2', name: 'VS2', display_order: 6 },
            ];

            for (const clarity of clarities) {
                const existing = await this.prisma.diamond_clarities.findFirst({
                    where: {
                        diamond_type_id: naturalType.id,
                        code: clarity.code,
                    },
                });

                if (existing) {
                    await this.prisma.diamond_clarities.update({
                        where: { id: existing.id },
                        data: {
                            name: clarity.name,
                            is_active: true,
                            display_order: clarity.display_order,
                        },
                    });
                } else {
                    await this.prisma.diamond_clarities.create({
                        data: {
                            diamond_type_id: naturalType.id,
                            code: clarity.code,
                            name: clarity.name,
                            is_active: true,
                            display_order: clarity.display_order,
                        },
                    });
                }
            }

            this.log(`Seeded ${clarities.length} diamond clarities`);
        }
    }
}
