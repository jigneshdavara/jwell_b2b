<?php

namespace Database\Seeders;

use App\Models\Diamond;
use App\Models\DiamondClarity;
use App\Models\DiamondColor;
use App\Models\DiamondShape;
use App\Models\DiamondShapeSize;
use App\Models\DiamondType;
use Illuminate\Database\Seeder;

class DiamondDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedDiamondTypes();
        $this->seedDiamondClarities();
        $this->seedDiamondColors();
        $this->seedDiamondShapes();
        $this->seedDiamondShapeSizes();
        $this->seedDiamonds();
    }

    protected function seedDiamondTypes(): void
    {
        $this->command->info('Seeding diamond types...');

        $types = [
            [
                'code' => 'NAT',
                'name' => 'Natural Diamond',
                'description' => 'Natural diamonds formed deep within the Earth over millions of years.',
                'display_order' => 1,
            ],
            [
                'code' => 'LAB',
                'name' => 'Lab Grown Diamond',
                'description' => 'Laboratory-grown diamonds with identical physical and chemical properties to natural diamonds.',
                'display_order' => 2,
            ],
            [
                'code' => 'FANCY',
                'name' => 'Fancy Color Diamond',
                'description' => 'Fancy colored diamonds including yellow, pink, blue, and other hues.',
                'display_order' => 6,
            ],
        ];

        foreach ($types as $type) {
            DiamondType::updateOrCreate(
                ['name' => $type['name']],
                [
                    'code' => $type['code'],
                    'description' => $type['description'],
                    'is_active' => true,
                    'display_order' => $type['display_order'],
                ]
            );
        }

        $this->command->info('Imported ' . count($types) . ' diamond types.');
    }

    protected function seedDiamondClarities(): void
    {
        $this->command->info('Seeding diamond clarities...');

        // Get diamond types
        $naturalType = DiamondType::where('code', 'NAT')->first();
        $fancyType = DiamondType::where('code', 'FANCY')->first();

        if (!$naturalType) {
            $this->command->error('Natural Diamond type not found. Please seed diamond types first.');
            return;
        }

        if (!$fancyType) {
            $this->command->error('Fancy Color Diamond type not found. Please seed diamond types first.');
            return;
        }

        // Natural Diamond clarities
        $naturalClarities = [
            ['code' => 'A1', 'name' => 'A1', 'description' => '', 'display_order' => 1],
            ['code' => 'A2', 'name' => 'A2', 'description' => '', 'display_order' => 2],
            ['code' => 'A3', 'name' => 'A3', 'description' => '', 'display_order' => 3],
            ['code' => 'A4', 'name' => 'A4', 'description' => '', 'display_order' => 4],
            ['code' => 'I', 'name' => 'I', 'description' => '', 'display_order' => 5],
            ['code' => 'I1', 'name' => 'I1', 'description' => '', 'display_order' => 6],
            ['code' => 'I2', 'name' => 'I2', 'description' => '', 'display_order' => 7],
            ['code' => 'I1-I2', 'name' => 'I1-I2', 'description' => '', 'display_order' => 8],
            ['code' => 'VVS', 'name' => 'VVS', 'description' => '', 'display_order' => 9],
            ['code' => 'VS', 'name' => 'VS', 'description' => '', 'display_order' => 12],
            ['code' => 'SI', 'name' => 'SI', 'description' => '', 'display_order' => 13],
            ['code' => 'VS-SI', 'name' => 'VS-SI', 'description' => '', 'display_order' => 11],
            ['code' => 'VVS-VS', 'name' => 'VVS-VS', 'description' => '', 'display_order' => 10],
            ['code' => 'C-VVS', 'name' => 'C-VVS', 'description' => '', 'display_order' => 14],
            ['code' => 'C-VVS-VS', 'name' => 'C-VVS-VS', 'description' => '', 'display_order' => 15],
            ['code' => 'C-VS', 'name' => 'C-VS', 'description' => '', 'display_order' => 16],
            ['code' => 'C-VS-SI', 'name' => 'C-VS-SI', 'description' => '', 'display_order' => 17],
            ['code' => 'PD', 'name' => 'PD', 'description' => '', 'display_order' => 18],
            ['code' => 'C-PD', 'name' => 'C-PD', 'description' => '', 'display_order' => 19],
            ['code' => 'SI2', 'name' => 'SI2', 'description' => '', 'display_order' => 20],
            ['code' => 'S-SI', 'name' => 'S-SI', 'description' => '', 'display_order' => 21],
            ['code' => 'MOZ', 'name' => 'MOZ', 'description' => '', 'display_order' => 22],
            ['code' => 'VVS1', 'name' => 'VVS1', 'description' => '', 'display_order' => 23],
            ['code' => 'C-SI', 'name' => 'C-SI', 'description' => '', 'display_order' => 24],
        ];

        foreach ($naturalClarities as $clarity) {
            DiamondClarity::updateOrCreate(
                [
                    'diamond_type_id' => $naturalType->id,
                    'name' => $clarity['name'],
                ],
                [
                    'code' => $clarity['code'] ?: null,
                    'description' => $clarity['description'] ?: null,
                    'display_order' => $clarity['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($naturalClarities) . ' natural diamond clarities.');

        // Fancy Color Diamond clarities from Excel file
        $fancyClarities = [
            ['code' => 'CUS', 'name' => 'CUS', 'description' => '', 'display_order' => 1],
            ['code' => 'CER', 'name' => 'CER', 'description' => '', 'display_order' => 2],
            ['code' => 'CZ', 'name' => 'CZ', 'description' => '', 'display_order' => 2],
            ['code' => 'S-MOL', 'name' => 'S-MOL', 'description' => '', 'display_order' => 3],
            ['code' => 'N-MOP', 'name' => 'N-MOP', 'description' => '', 'display_order' => 4],
            ['code' => 'N-AME', 'name' => 'N-AME', 'description' => '', 'display_order' => 5],
            ['code' => 'S-AME', 'name' => 'S-AME', 'description' => '', 'display_order' => 6],
            ['code' => 'N-AQM', 'name' => 'N-AQM', 'description' => '', 'display_order' => 7],
            ['code' => 'S-AQM', 'name' => 'S-AQM', 'description' => '', 'display_order' => 8],
            ['code' => 'S-CIT', 'name' => 'S-CIT', 'description' => '', 'display_order' => 9],
            ['code' => 'N-CIT', 'name' => 'N-CIT', 'description' => '', 'display_order' => 10],
            ['code' => 'N-CRL', 'name' => 'N-CRL', 'description' => '', 'display_order' => 11],
            ['code' => 'S-CRL', 'name' => 'S-CRL', 'description' => '', 'display_order' => 12],
            ['code' => 'S-EMR', 'name' => 'S-EMR', 'description' => '', 'display_order' => 13],
            ['code' => 'N-EMR', 'name' => 'N-EMR', 'description' => '', 'display_order' => 14],
            ['code' => 'S-GRT', 'name' => 'S-GRT', 'description' => '', 'display_order' => 15],
            ['code' => 'N-GRT', 'name' => 'N-GRT', 'description' => '', 'display_order' => 16],
            ['code' => 'N-JDE', 'name' => 'N-JDE', 'description' => '', 'display_order' => 17],
            ['code' => 'S-JDE', 'name' => 'S-JDE', 'description' => '', 'display_order' => 18],
            ['code' => 'S-LPZ', 'name' => 'S-LPZ', 'description' => '', 'display_order' => 19],
            ['code' => 'N-LPZ', 'name' => 'N-LPZ', 'description' => '', 'display_order' => 20],
            ['code' => 'N-MLA', 'name' => 'N-MLA', 'description' => '', 'display_order' => 21],
            ['code' => 'S-MLA', 'name' => 'S-MLA', 'description' => '', 'display_order' => 22],
            ['code' => 'EVE', 'name' => 'EVE', 'description' => '', 'display_order' => 22],
            ['code' => 'S-ONX', 'name' => 'S-ONX', 'description' => '', 'display_order' => 23],
            ['code' => 'N-ONX', 'name' => 'N-ONX', 'description' => '', 'display_order' => 23],
            ['code' => 'N-MST', 'name' => 'N-MST', 'description' => '', 'display_order' => 24],
            ['code' => 'N-OPL', 'name' => 'N-OPL', 'description' => '', 'display_order' => 25],
            ['code' => 'S-OPL', 'name' => 'S-OPL', 'description' => '', 'display_order' => 26],
            ['code' => 'S-PDT', 'name' => 'S-PDT', 'description' => '', 'display_order' => 27],
            ['code' => 'N-PDT', 'name' => 'N-PDT', 'description' => '', 'display_order' => 28],
            ['code' => 'N-PRL', 'name' => 'N-PRL', 'description' => '', 'display_order' => 29],
            ['code' => 'S-PRL', 'name' => 'S-PRL', 'description' => '', 'display_order' => 29],
            ['code' => 'N-RUB', 'name' => 'N-RUB', 'description' => '', 'display_order' => 29],
            ['code' => 'S-RUB', 'name' => 'S-RUB', 'description' => '', 'display_order' => 30],
            ['code' => 'N-SPR', 'name' => 'N-SPR', 'description' => '', 'display_order' => 31],
            ['code' => 'S-SPR', 'name' => 'S-SPR', 'description' => '', 'display_order' => 32],
            ['code' => 'S-TGE', 'name' => 'S-TGE', 'description' => '', 'display_order' => 33],
            ['code' => 'N-TGE', 'name' => 'N-TGE', 'description' => '', 'display_order' => 34],
            ['code' => 'N-TNZ', 'name' => 'N-TNZ', 'description' => '', 'display_order' => 35],
            ['code' => 'S-TNZ', 'name' => 'S-TNZ', 'description' => '', 'display_order' => 36],
            ['code' => 'N-TPZ', 'name' => 'N-TPZ', 'description' => '', 'display_order' => 37],
            ['code' => 'S-TPZ', 'name' => 'S-TPZ', 'description' => '', 'display_order' => 38],
            ['code' => 'S-TQS', 'name' => 'S-TQS', 'description' => '', 'display_order' => 39],
            ['code' => 'N-TQS', 'name' => 'N-TQS', 'description' => '', 'display_order' => 40],
            ['code' => 'N-TRM', 'name' => 'N-TRM', 'description' => '', 'display_order' => 41],
            ['code' => 'S-TRM', 'name' => 'S-TRM', 'description' => '', 'display_order' => 42],
            ['code' => 'N-SQZ', 'name' => 'N-SQZ', 'description' => '', 'display_order' => 46],
            ['code' => 'MOZ', 'name' => 'MOZ', 'description' => '', 'display_order' => 50],
            ['code' => 'S-SQZ', 'name' => 'S-SQZ', 'description' => 'NA', 'display_order' => 51],
            ['code' => 'L-TNZ', 'name' => 'L-TNZ', 'description' => '', 'display_order' => 52],
            ['code' => 'L-RUB', 'name' => 'L-RUB', 'description' => '', 'display_order' => 53],
            ['code' => 'L-EMR', 'name' => 'L-EMR', 'description' => '', 'display_order' => 54],
        ];

        foreach ($fancyClarities as $clarity) {
            DiamondClarity::updateOrCreate(
                [
                    'diamond_type_id' => $fancyType->id,
                    'name' => $clarity['name'],
                ],
                [
                    'code' => $clarity['code'] ?: null,
                    'description' => $clarity['description'] ?: null,
                    'display_order' => $clarity['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($fancyClarities) . ' fancy color diamond clarities.');
    }

    protected function seedDiamondColors(): void
    {
        $this->command->info('Seeding diamond colors...');

        // Get diamond types
        $naturalType = DiamondType::where('code', 'NAT')->first();
        $fancyType = DiamondType::where('code', 'FANCY')->first();

        if (!$naturalType) {
            $this->command->error('Natural Diamond type not found. Please seed diamond types first.');
            return;
        }

        if (!$fancyType) {
            $this->command->error('Fancy Color Diamond type not found. Please seed diamond types first.');
            return;
        }

        // Natural Diamond colors
        $naturalColors = [
            ['code' => 'UnGraded', 'name' => 'UnGraded', 'description' => '', 'display_order' => 1],
            ['code' => 'DEF', 'name' => 'DEF', 'description' => '', 'display_order' => 1],
            ['code' => 'EF', 'name' => 'EF', 'description' => '', 'display_order' => 2],
            ['code' => 'FG', 'name' => 'FG', 'description' => '', 'display_order' => 3],
            ['code' => 'GH', 'name' => 'GH', 'description' => '', 'display_order' => 5],
            ['code' => 'HI', 'name' => 'HI', 'description' => '', 'display_order' => 6],
            ['code' => 'IJ', 'name' => 'IJ', 'description' => '', 'display_order' => 7],
            ['code' => 'JK', 'name' => 'JK', 'description' => '', 'display_order' => 8],
            ['code' => 'PD', 'name' => 'PD', 'description' => '', 'display_order' => 9],
            ['code' => 'WHT', 'name' => 'WHT', 'description' => '', 'display_order' => 10],
        ];

        foreach ($naturalColors as $color) {
            DiamondColor::updateOrCreate(
                [
                    'diamond_type_id' => $naturalType->id,
                    'name' => $color['name'],
                ],
                [
                    'code' => $color['code'] ?: null,
                    'description' => $color['description'] ?: null,
                    'display_order' => $color['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($naturalColors) . ' natural diamond colors.');

        // Fancy Color Diamond colors from Excel file
        $fancyColors = [
            ['code' => 'UnGraded', 'name' => 'UnGraded', 'description' => '', 'display_order' => 0],
            ['code' => 'BLK', 'name' => 'BLK', 'description' => '', 'display_order' => 1],
            ['code' => 'BLU', 'name' => 'BLU', 'description' => 'Blue', 'display_order' => 2],
            ['code' => 'BRW', 'name' => 'BRW', 'description' => 'Brown', 'display_order' => 4],
            ['code' => 'DPK', 'name' => 'DPK', 'description' => '', 'display_order' => 5],
            ['code' => 'GRN', 'name' => 'GRN', 'description' => '', 'display_order' => 6],
            ['code' => 'GRY', 'name' => 'GRY', 'description' => '', 'display_order' => 7],
            ['code' => 'LBL', 'name' => 'LBL', 'description' => '', 'display_order' => 8],
            ['code' => 'LGN', 'name' => 'LGN', 'description' => '', 'display_order' => 9],
            ['code' => 'LPK', 'name' => 'LPK', 'description' => '', 'display_order' => 10],
            ['code' => 'GLD', 'name' => 'GLD', 'description' => '', 'display_order' => 11],
            ['code' => 'ORC', 'name' => 'ORC', 'description' => '', 'display_order' => 12],
            ['code' => 'PNK', 'name' => 'PNK', 'description' => '', 'display_order' => 13],
            ['code' => 'PUR', 'name' => 'PUR', 'description' => '', 'display_order' => 14],
            ['code' => 'RED', 'name' => 'RED', 'description' => '', 'display_order' => 15],
            ['code' => 'RNB', 'name' => 'RNB', 'description' => '', 'display_order' => 16],
            ['code' => 'WHT', 'name' => 'WHT', 'description' => '', 'display_order' => 17],
            ['code' => 'YLW', 'name' => 'YLW', 'description' => '', 'display_order' => 18],
            ['code' => 'NYW', 'name' => 'NYW', 'description' => '', 'display_order' => 19],
            ['code' => 'NOG', 'name' => 'NOG', 'description' => '', 'display_order' => 20],
            ['code' => 'NPK', 'name' => 'NPK', 'description' => '', 'display_order' => 21],
            ['code' => 'NGN', 'name' => 'NGN', 'description' => '', 'display_order' => 23],
            ['code' => 'PPK', 'name' => 'PPK', 'description' => '', 'display_order' => 21],
            ['code' => 'PSG', 'name' => 'PSG', 'description' => '', 'display_order' => 24],
            ['code' => 'PSP', 'name' => 'PSP', 'description' => '', 'display_order' => 25],
            ['code' => 'PSB', 'name' => 'PSB', 'description' => '', 'display_order' => 26],
            ['code' => 'PPL', 'name' => 'PPL', 'description' => '', 'display_order' => 27],
            ['code' => 'OCM', 'name' => 'OCM', 'description' => '', 'display_order' => 27],
            ['code' => 'PEP', 'name' => 'PEP', 'description' => '', 'display_order' => 29],
            ['code' => 'GPU', 'name' => 'GPU', 'description' => '', 'display_order' => 30],
            ['code' => 'MIG', 'name' => 'MIG', 'description' => '', 'display_order' => 31],
            ['code' => 'YBL', 'name' => 'YBL', 'description' => '', 'display_order' => 32],
            ['code' => 'MPL', 'name' => 'MPL', 'description' => '', 'display_order' => 33],
            ['code' => 'IVR', 'name' => 'IVR', 'description' => '', 'display_order' => 34],
            ['code' => 'PVR', 'name' => 'PVR', 'description' => '', 'display_order' => 34],
            ['code' => 'ORG', 'name' => 'ORG', 'description' => '', 'display_order' => 35],
            ['code' => 'MRN', 'name' => 'MRN', 'description' => '', 'display_order' => 36],
            ['code' => 'DBR', 'name' => 'DBR', 'description' => '', 'display_order' => 37],
            ['code' => 'LBR', 'name' => 'LBR', 'description' => '', 'display_order' => 38],
            ['code' => 'POG', 'name' => 'POG', 'description' => '', 'display_order' => 39],
            ['code' => 'MIX', 'name' => 'MIX', 'description' => '', 'display_order' => 21],
        ];

        foreach ($fancyColors as $color) {
            DiamondColor::updateOrCreate(
                [
                    'diamond_type_id' => $fancyType->id,
                    'name' => $color['name'],
                ],
                [
                    'code' => $color['code'] ?: null,
                    'description' => $color['description'] ?: null,
                    'display_order' => $color['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($fancyColors) . ' fancy color diamond colors.');
    }

    protected function seedDiamondShapes(): void
    {
        $this->command->info('Seeding diamond shapes...');

        // Get diamond types
        $naturalType = DiamondType::where('code', 'NAT')->first();
        $fancyType = DiamondType::where('code', 'FANCY')->first();

        if (!$naturalType) {
            $this->command->error('Natural Diamond type not found. Please seed diamond types first.');
            return;
        }

        if (!$fancyType) {
            $this->command->error('Fancy Color Diamond type not found. Please seed diamond types first.');
            return;
        }

        // Natural Diamond shapes
        $naturalShapes = [
            ['code' => 'UnGraded', 'name' => 'UnGraded', 'display_order' => 0],
            ['code' => 'RND', 'name' => 'RND', 'display_order' => 1],
            ['code' => 'RND-S', 'name' => 'RND-S', 'display_order' => 2],
            ['code' => 'BUG', 'name' => 'BUG', 'display_order' => 3],
            ['code' => 'HRT', 'name' => 'HRT', 'display_order' => 4],
            ['code' => 'MRQ', 'name' => 'MRQ', 'display_order' => 5],
            ['code' => 'OVL', 'name' => 'OVL', 'display_order' => 6],
            ['code' => 'PRI', 'name' => 'PRI', 'display_order' => 7],
            ['code' => 'EMR', 'name' => 'EMR', 'display_order' => 8],
            ['code' => 'PRS', 'name' => 'PRS', 'display_order' => 9],
            ['code' => 'CSN', 'name' => 'CSN', 'display_order' => 10],
            ['code' => 'ASH', 'name' => 'ASH', 'display_order' => 11],
            ['code' => 'CUS', 'name' => 'CUS', 'display_order' => 12],
            ['code' => 'RSC', 'name' => 'RSC', 'display_order' => 13],
        ];

        foreach ($naturalShapes as $shape) {
            DiamondShape::updateOrCreate(
                [
                    'diamond_type_id' => $naturalType->id,
                    'name' => $shape['name'],
                ],
                [
                    'code' => $shape['code'] ?: null,
                    'description' => null,
                    'display_order' => $shape['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($naturalShapes) . ' natural diamond shapes.');

        // Fancy Color Diamond shapes from Excel file
        $fancyShapes = [
            ['code' => 'UnGraded', 'name' => 'UnGraded', 'display_order' => 0],
            ['code' => 'ASH', 'name' => 'ASH', 'display_order' => 1],
            ['code' => 'BUG', 'name' => 'BUG', 'display_order' => 3],
            ['code' => 'CUS', 'name' => 'CUS', 'display_order' => 6],
            ['code' => 'FBFD', 'name' => 'FBFD', 'display_order' => 11],
            ['code' => 'HBHD', 'name' => 'HBHD', 'display_order' => 14],
            ['code' => 'OCT', 'name' => 'OCT', 'display_order' => 17],
            ['code' => 'OVL', 'name' => 'OVL', 'display_order' => 18],
            ['code' => 'OVL-CB', 'name' => 'OVL-CB', 'display_order' => 19],
            ['code' => 'PRI', 'name' => 'PRI', 'display_order' => 20],
            ['code' => 'PRI-CB', 'name' => 'PRI-CB', 'display_order' => 21],
            ['code' => 'PRS', 'name' => 'PRS', 'display_order' => 22],
            ['code' => 'PRS-CB', 'name' => 'PRS-CB', 'display_order' => 23],
            ['code' => 'RND', 'name' => 'RND', 'display_order' => 24],
            ['code' => 'RND-CB', 'name' => 'RND-CB', 'display_order' => 25],
            ['code' => 'BAL', 'name' => 'BAL', 'display_order' => 2],
            ['code' => 'CSN', 'name' => 'CSN', 'display_order' => 4],
            ['code' => 'CSN-CB', 'name' => 'CSN-CB', 'display_order' => 5],
            ['code' => 'DRFD', 'name' => 'DRFD', 'display_order' => 7],
            ['code' => 'DRHD', 'name' => 'DRHD', 'display_order' => 8],
            ['code' => 'EMR', 'name' => 'EMR', 'display_order' => 9],
            ['code' => 'EMR-CB', 'name' => 'EMR-CB', 'display_order' => 10],
            ['code' => 'FBHD', 'name' => 'FBHD', 'display_order' => 12],
            ['code' => 'HBFD', 'name' => 'HBFD', 'display_order' => 13],
            ['code' => 'HRT', 'name' => 'HRT', 'display_order' => 15],
            ['code' => 'MRQ', 'name' => 'MRQ', 'display_order' => 16],
            ['code' => 'TRI', 'name' => 'TRI', 'display_order' => 27],
            ['code' => 'TRL', 'name' => 'TRL', 'display_order' => 28],
        ];

        foreach ($fancyShapes as $shape) {
            DiamondShape::updateOrCreate(
                [
                    'diamond_type_id' => $fancyType->id,
                    'name' => $shape['name'],
                ],
                [
                    'code' => $shape['code'] ?: null,
                    'description' => null,
                    'display_order' => $shape['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($fancyShapes) . ' fancy color diamond shapes.');
    }

    protected function seedDiamondShapeSizes(): void
    {
        $this->command->info('Seeding diamond shape sizes...');

        // Get all shapes indexed by name for lookup
        $shapes = DiamondShape::all()->keyBy('name');

        // Get diamond types
        $naturalType = DiamondType::where('code', 'NAT')->first();
        $fancyType = DiamondType::where('code', 'FANCY')->first();

        if (!$naturalType) {
            $this->command->error('Natural Diamond type not found. Please seed diamond types first.');
            return;
        }

        if (!$fancyType) {
            $this->command->error('Fancy Color Diamond type not found. Please seed diamond types first.');
            return;
        }

        $shapeSizes = [
            // UnGraded
            ['shape_name' => 'UnGraded', 'size' => 'UnGraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],

            // RND
            ['shape_name' => 'RND', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'RND', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'RND', 'size' => '1.05', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 5, 'ctw' => 0.005],
            ['shape_name' => 'RND', 'size' => '1.15', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.007],
            ['shape_name' => 'RND', 'size' => '1.25', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.009],
            ['shape_name' => 'RND', 'size' => '1.35', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 0.011],
            ['shape_name' => 'RND', 'size' => '1.45', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.013],
            ['shape_name' => 'RND', 'size' => '1.55', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 0.016],
            ['shape_name' => 'RND', 'size' => '1.65', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 16, 'ctw' => 0.018],
            ['shape_name' => 'RND', 'size' => '1.75', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 17, 'ctw' => 0.020],
            ['shape_name' => 'RND', 'size' => '1.80', 'secondary_size' => '', 'description' => '', 'display_order' => 18, 'ctw' => 0.025],
            ['shape_name' => 'RND', 'size' => '1.85', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 18, 'ctw' => 0.025],
            ['shape_name' => 'RND', 'size' => '1.90', 'secondary_size' => '', 'description' => '', 'display_order' => 19, 'ctw' => 0.030],
            ['shape_name' => 'RND', 'size' => '1.95', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 19, 'ctw' => 0.030],
            ['shape_name' => 'RND', 'size' => '2.00', 'secondary_size' => '', 'description' => '', 'display_order' => 20, 'ctw' => 0.035],
            ['shape_name' => 'RND', 'size' => '2.05', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 20, 'ctw' => 0.035],
            ['shape_name' => 'RND', 'size' => '2.10', 'secondary_size' => '', 'description' => '', 'display_order' => 21, 'ctw' => 0.040],
            ['shape_name' => 'RND', 'size' => '2.15', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 21, 'ctw' => 0.040],
            ['shape_name' => 'RND', 'size' => '2.20', 'secondary_size' => '', 'description' => '', 'display_order' => 22, 'ctw' => 0.045],
            ['shape_name' => 'RND', 'size' => '2.30', 'secondary_size' => '', 'description' => '', 'display_order' => 23, 'ctw' => 0.050],
            ['shape_name' => 'RND', 'size' => '0.80', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.003],
            ['shape_name' => 'RND', 'size' => '1.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.005],
            ['shape_name' => 'RND', 'size' => '1.10', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.006],
            ['shape_name' => 'RND', 'size' => '1.20', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.008],
            ['shape_name' => 'RND', 'size' => '1.30', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.010],
            ['shape_name' => 'RND', 'size' => '1.40', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.012],
            ['shape_name' => 'RND', 'size' => '1.50', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.014],
            ['shape_name' => 'RND', 'size' => '1.60', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 0.018],
            ['shape_name' => 'RND', 'size' => '1.70', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 0.020],
            ['shape_name' => 'RND', 'size' => '2.40', 'secondary_size' => '', 'description' => '', 'display_order' => 24, 'ctw' => 0.058],
            ['shape_name' => 'RND', 'size' => '2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 25, 'ctw' => 0.060],
            ['shape_name' => 'RND', 'size' => '2.60', 'secondary_size' => '', 'description' => '', 'display_order' => 26, 'ctw' => 0.070],
            ['shape_name' => 'RND', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 30, 'ctw' => 0.100],
            ['shape_name' => 'RND', 'size' => '3.40', 'secondary_size' => '', 'description' => '', 'display_order' => 34, 'ctw' => 0.140],
            ['shape_name' => 'RND', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 35, 'ctw' => 0.150],
            ['shape_name' => 'RND', 'size' => '0.90', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.004],
            ['shape_name' => 'RND', 'size' => '2.70', 'secondary_size' => '', 'description' => '', 'display_order' => 27, 'ctw' => 0.079],
            ['shape_name' => 'RND', 'size' => '2.80', 'secondary_size' => '', 'description' => '', 'display_order' => 28, 'ctw' => 0.080],
            ['shape_name' => 'RND', 'size' => '2.90', 'secondary_size' => '', 'description' => '', 'display_order' => 29, 'ctw' => 0.090],
            ['shape_name' => 'RND', 'size' => '3.10', 'secondary_size' => '', 'description' => '', 'display_order' => 31, 'ctw' => 0.110],
            ['shape_name' => 'RND', 'size' => '3.20', 'secondary_size' => '', 'description' => '', 'display_order' => 32, 'ctw' => 0.120],
            ['shape_name' => 'RND', 'size' => '3.80', 'secondary_size' => '', 'description' => '', 'display_order' => 38, 'ctw' => 0.200],
            ['shape_name' => 'RND', 'size' => '4.10', 'secondary_size' => '', 'description' => '', 'display_order' => 41, 'ctw' => 0.250],
            ['shape_name' => 'RND', 'size' => '4.40', 'secondary_size' => '', 'description' => '', 'display_order' => 44, 'ctw' => 0.310],
            ['shape_name' => 'RND', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 45, 'ctw' => 0.330],
            ['shape_name' => 'RND', 'size' => '4.80', 'secondary_size' => '', 'description' => '', 'display_order' => 49, 'ctw' => 0.430],
            ['shape_name' => 'RND', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 56, 'ctw' => 0.650],
            ['shape_name' => 'RND', 'size' => '5.80', 'secondary_size' => '', 'description' => '', 'display_order' => 59, 'ctw' => 0.770],
            ['shape_name' => 'RND', 'size' => '5.90', 'secondary_size' => '', 'description' => '', 'display_order' => 60, 'ctw' => 0.800],
            ['shape_name' => 'RND', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 65, 'ctw' => 1.000],
            ['shape_name' => 'RND', 'size' => '3.30', 'secondary_size' => '', 'description' => '', 'display_order' => 33, 'ctw' => 0.130],
            ['shape_name' => 'RND', 'size' => '3.60', 'secondary_size' => '', 'description' => '', 'display_order' => 36, 'ctw' => 0.170],
            ['shape_name' => 'RND', 'size' => '3.90', 'secondary_size' => '', 'description' => '', 'display_order' => 39, 'ctw' => 0.220],
            ['shape_name' => 'RND', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 40, 'ctw' => 0.230],
            ['shape_name' => 'RND', 'size' => '4.20', 'secondary_size' => '', 'description' => '', 'display_order' => 42, 'ctw' => 0.270],
            ['shape_name' => 'RND', 'size' => '4.30', 'secondary_size' => '', 'description' => '', 'display_order' => 43, 'ctw' => 0.290],
            ['shape_name' => 'RND', 'size' => '4.60', 'secondary_size' => '', 'description' => '', 'display_order' => 46, 'ctw' => 0.350],
            ['shape_name' => 'RND', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 50, 'ctw' => 0.450],
            ['shape_name' => 'RND', 'size' => '5.25', 'secondary_size' => '', 'description' => '', 'display_order' => 53, 'ctw' => 0.500],
            ['shape_name' => 'RND', 'size' => '5.30', 'secondary_size' => '', 'description' => '', 'display_order' => 54, 'ctw' => 0.550],
            ['shape_name' => 'RND', 'size' => '5.40', 'secondary_size' => '', 'description' => '', 'display_order' => 55, 'ctw' => 0.600],
            ['shape_name' => 'RND', 'size' => '5.75', 'secondary_size' => '', 'description' => '', 'display_order' => 58, 'ctw' => 0.750],
            ['shape_name' => 'RND', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 61, 'ctw' => 0.850],
            ['shape_name' => 'RND', 'size' => '6.25', 'secondary_size' => '', 'description' => '', 'display_order' => 62, 'ctw' => 0.930],
            ['shape_name' => 'RND', 'size' => '6.75', 'secondary_size' => '', 'description' => '', 'display_order' => 67, 'ctw' => 1.240],
            ['shape_name' => 'RND', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 70, 'ctw' => 1.280],
            ['shape_name' => 'RND', 'size' => '7.25', 'secondary_size' => '', 'description' => '', 'display_order' => 72, 'ctw' => 1.490],
            ['shape_name' => 'RND', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 75, 'ctw' => 1.670],
            ['shape_name' => 'RND', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 80, 'ctw' => 2.040],
            ['shape_name' => 'RND', 'size' => '8.25', 'secondary_size' => '', 'description' => '', 'display_order' => 82, 'ctw' => 2.110],
            ['shape_name' => 'RND', 'size' => '8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 85, 'ctw' => 2.430],
            ['shape_name' => 'RND', 'size' => '8.75', 'secondary_size' => '', 'description' => '', 'display_order' => 87, 'ctw' => 2.550],
            ['shape_name' => 'RND', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 90, 'ctw' => 2.750],
            ['shape_name' => 'RND', 'size' => '9.25', 'secondary_size' => '', 'description' => '', 'display_order' => 92, 'ctw' => 3.050],
            ['shape_name' => 'RND', 'size' => '0.95', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 4, 'ctw' => 0.004],
            ['shape_name' => 'RND', 'size' => '4.75', 'secondary_size' => '', 'description' => '', 'display_order' => 48, 'ctw' => 0.400],
            ['shape_name' => 'RND', 'size' => '6.30', 'secondary_size' => '', 'description' => '', 'display_order' => 63, 'ctw' => 0.950],
            ['shape_name' => 'RND', 'size' => 'MIX', 'secondary_size' => '', 'description' => 'Mix', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'RND', 'size' => '0.70', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 83, 'ctw' => 0.002],
            ['shape_name' => 'RND', 'size' => '0.75', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 84, 'ctw' => 0.003],
            ['shape_name' => 'RND', 'size' => '0.85', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 85, 'ctw' => 0.004],
            ['shape_name' => 'RND', 'size' => '2.25', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 86, 'ctw' => 0.048],
            ['shape_name' => 'RND', 'size' => '2.35', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 87, 'ctw' => 0.055],
            ['shape_name' => 'RND', 'size' => '2.45', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 88, 'ctw' => 0.060],
            ['shape_name' => 'RND', 'size' => '2.55', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 89, 'ctw' => 0.065],
            ['shape_name' => 'RND', 'size' => '2.65', 'secondary_size' => '', 'description' => 'Use for Only Titan', 'display_order' => 90, 'ctw' => 0.075],

            // RND-S
            ['shape_name' => 'RND-S', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'RND-S', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'RND-S', 'size' => '0.80', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.003],
            ['shape_name' => 'RND-S', 'size' => '0.90', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.004],
            ['shape_name' => 'RND-S', 'size' => '1.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.005],
            ['shape_name' => 'RND-S', 'size' => '1.10', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.006],
            ['shape_name' => 'RND-S', 'size' => '1.15', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.007],
            ['shape_name' => 'RND-S', 'size' => '1.20', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.008],

            // BUG
            ['shape_name' => 'BUG', 'size' => '1.75x0.87(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.008],
            ['shape_name' => 'BUG', 'size' => '2.00x1.00(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.010],
            ['shape_name' => 'BUG', 'size' => '2.25x1.12(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.012],
            ['shape_name' => 'BUG', 'size' => '2.25x1.12(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.012],
            ['shape_name' => 'BUG', 'size' => '2.50x1.25(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.015],
            ['shape_name' => 'BUG', 'size' => '2.50x1.25(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.015],
            ['shape_name' => 'BUG', 'size' => '2.75x1.37(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.020],
            ['shape_name' => 'BUG', 'size' => '2.75x1.37(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.020],
            ['shape_name' => 'BUG', 'size' => '3.00x1.50(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.025],
            ['shape_name' => 'BUG', 'size' => '3.00x1.50(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.025],
            ['shape_name' => 'BUG', 'size' => '3.50x1.75(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.065],
            ['shape_name' => 'BUG', 'size' => '3.50x1.75(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 0.065],
            ['shape_name' => 'BUG', 'size' => '2.00x1.00(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.010],
            ['shape_name' => 'BUG', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'BUG', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'BUG', 'size' => '1.50x0.75(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.006],
            ['shape_name' => 'BUG', 'size' => '1.50x0.75(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.006],
            ['shape_name' => 'BUG', 'size' => '1.75x0.87(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.008],
            ['shape_name' => 'BUG', 'size' => '1.75x1.00(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.010],
            ['shape_name' => 'BUG', 'size' => '3.30x1.50(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.050],
            ['shape_name' => 'BUG', 'size' => '3.30x1.50(T)', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.050],
            ['shape_name' => 'BUG', 'size' => 'MIX', 'secondary_size' => '', 'description' => 'Mix', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'BUG', 'size' => '1.25x0.65(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.004],

            // HRT
            ['shape_name' => 'HRT', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.150],
            ['shape_name' => 'HRT', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.180],
            ['shape_name' => 'HRT', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.250],
            ['shape_name' => 'HRT', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.350],
            ['shape_name' => 'HRT', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.500],
            ['shape_name' => 'HRT', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.600],
            ['shape_name' => 'HRT', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.750],
            ['shape_name' => 'HRT', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 1.000],
            ['shape_name' => 'HRT', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'HRT', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // MRQ
            ['shape_name' => 'MRQ', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'MRQ', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'MRQ', 'size' => '1.50x2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.020],
            ['shape_name' => 'MRQ', 'size' => '1.50x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.035],
            ['shape_name' => 'MRQ', 'size' => '1.50x3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.038],
            ['shape_name' => 'MRQ', 'size' => '2.00x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.050],
            ['shape_name' => 'MRQ', 'size' => '2.00x3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.055],
            ['shape_name' => 'MRQ', 'size' => '2.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.080],
            ['shape_name' => 'MRQ', 'size' => '2.50x3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.090],
            ['shape_name' => 'MRQ', 'size' => '2.50x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.140],
            ['shape_name' => 'MRQ', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 0.150],
            ['shape_name' => 'MRQ', 'size' => '3.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.200],
            ['shape_name' => 'MRQ', 'size' => '4.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.500],
            ['shape_name' => 'MRQ', 'size' => '4.50x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.600],
            ['shape_name' => 'MRQ', 'size' => '4.50x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 0.700],
            ['shape_name' => 'MRQ', 'size' => '5.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 1.000],
            ['shape_name' => 'MRQ', 'size' => '3.50x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 0.350],
            ['shape_name' => 'MRQ', 'size' => 'MIX', 'secondary_size' => '', 'description' => 'Mix', 'display_order' => 1, 'ctw' => 0.000],

            // OVL
            ['shape_name' => 'OVL', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'OVL', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'OVL', 'size' => '2.00x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.080],
            ['shape_name' => 'OVL', 'size' => '3.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.150],
            ['shape_name' => 'OVL', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.180],
            ['shape_name' => 'OVL', 'size' => '3.50x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.250],
            ['shape_name' => 'OVL', 'size' => '3.50x5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.300],
            ['shape_name' => 'OVL', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.400],
            ['shape_name' => 'OVL', 'size' => '4.50x6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.500],
            ['shape_name' => 'OVL', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.750],
            ['shape_name' => 'OVL', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 1.250],
            ['shape_name' => 'OVL', 'size' => '7.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 1.750],

            // PRI
            ['shape_name' => 'PRI', 'size' => '1.20', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.009],
            ['shape_name' => 'PRI', 'size' => '1.30', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.011],
            ['shape_name' => 'PRI', 'size' => '1.40', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.014],
            ['shape_name' => 'PRI', 'size' => '1.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.017],
            ['shape_name' => 'PRI', 'size' => '1.60', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.020],
            ['shape_name' => 'PRI', 'size' => '1.70', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.023],
            ['shape_name' => 'PRI', 'size' => '1.80', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.027],
            ['shape_name' => 'PRI', 'size' => '1.90', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.030],
            ['shape_name' => 'PRI', 'size' => '2.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 0.035],
            ['shape_name' => 'PRI', 'size' => '2.10', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.040],
            ['shape_name' => 'PRI', 'size' => '2.20', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.045],
            ['shape_name' => 'PRI', 'size' => '2.30', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.053],
            ['shape_name' => 'PRI', 'size' => '2.40', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 0.060],
            ['shape_name' => 'PRI', 'size' => '2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 0.070],
            ['shape_name' => 'PRI', 'size' => '2.60', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 0.075],
            ['shape_name' => 'PRI', 'size' => '2.70', 'secondary_size' => '', 'description' => '', 'display_order' => 18, 'ctw' => 0.080],
            ['shape_name' => 'PRI', 'size' => '2.80', 'secondary_size' => '', 'description' => '', 'display_order' => 19, 'ctw' => 0.090],
            ['shape_name' => 'PRI', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 20, 'ctw' => 0.180],
            ['shape_name' => 'PRI', 'size' => '3.20', 'secondary_size' => '', 'description' => '', 'display_order' => 21, 'ctw' => 0.250],
            ['shape_name' => 'PRI', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 22, 'ctw' => 0.290],
            ['shape_name' => 'PRI', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 23, 'ctw' => 0.400],
            ['shape_name' => 'PRI', 'size' => '4.20', 'secondary_size' => '', 'description' => '', 'display_order' => 24, 'ctw' => 0.440],
            ['shape_name' => 'PRI', 'size' => '4.70', 'secondary_size' => '', 'description' => '', 'display_order' => 25, 'ctw' => 0.650],
            ['shape_name' => 'PRI', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 26, 'ctw' => 0.750],
            ['shape_name' => 'PRI', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 27, 'ctw' => 1.000],
            ['shape_name' => 'PRI', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 28, 'ctw' => 1.500],
            ['shape_name' => 'PRI', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'PRI', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'PRI', 'size' => 'MIX', 'secondary_size' => '', 'description' => 'Mix', 'display_order' => 1, 'ctw' => 0.000],

            // EMR
            ['shape_name' => 'EMR', 'size' => '5.50x7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 1.500],
            ['shape_name' => 'EMR', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'EMR', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'EMR', 'size' => '2.00x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.150],
            ['shape_name' => 'EMR', 'size' => '3.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.200],
            ['shape_name' => 'EMR', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.250],
            ['shape_name' => 'EMR', 'size' => '3.50x4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.300],
            ['shape_name' => 'EMR', 'size' => '3.50x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.350],
            ['shape_name' => 'EMR', 'size' => '4.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.450],
            ['shape_name' => 'EMR', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.500],
            ['shape_name' => 'EMR', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 1.000],
            ['shape_name' => 'EMR', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 1.750],
            ['shape_name' => 'EMR', 'size' => '7.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 2.500],

            // PRS
            ['shape_name' => 'PRS', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'PRS', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'PRS', 'size' => '1.50x2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.020],
            ['shape_name' => 'PRS', 'size' => '2.00x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.048],
            ['shape_name' => 'PRS', 'size' => '2.00x3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.050],
            ['shape_name' => 'PRS', 'size' => '2.50x3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.070],
            ['shape_name' => 'PRS', 'size' => '2.50x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.100],
            ['shape_name' => 'PRS', 'size' => '3.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.170],
            ['shape_name' => 'PRS', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.250],
            ['shape_name' => 'PRS', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.500],
            ['shape_name' => 'PRS', 'size' => '4.50x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 0.650],
            ['shape_name' => 'PRS', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 0.700],
            ['shape_name' => 'PRS', 'size' => '5.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 0.750],
            ['shape_name' => 'PRS', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 18, 'ctw' => 1.250],
            ['shape_name' => 'PRS', 'size' => '6.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 19, 'ctw' => 1.350],
            ['shape_name' => 'PRS', 'size' => '1.50x2.80', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.022],
            ['shape_name' => 'PRS', 'size' => 'MIX', 'secondary_size' => '', 'description' => 'Mix', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'PRS', 'size' => '3.50x4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.300],
            ['shape_name' => 'PRS', 'size' => '3.50x5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.400],

            // CSN
            ['shape_name' => 'CSN', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 1.750],
            ['shape_name' => 'CSN', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.150],
            ['shape_name' => 'CSN', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.250],
            ['shape_name' => 'CSN', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.300],
            ['shape_name' => 'CSN', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.500],
            ['shape_name' => 'CSN', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 1.000],
            ['shape_name' => 'CSN', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 1.500],
            ['shape_name' => 'CSN', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'CSN', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'CSN', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.450],
            ['shape_name' => 'CSN', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 1.250],

            // ASH
            ['shape_name' => 'ASH', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.150],
            ['shape_name' => 'ASH', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.250],
            ['shape_name' => 'ASH', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.390],
            ['shape_name' => 'ASH', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.500],
            ['shape_name' => 'ASH', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.750],
            ['shape_name' => 'ASH', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 1.000],
            ['shape_name' => 'ASH', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 1.250],
            ['shape_name' => 'ASH', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'ASH', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // CUS
            ['shape_name' => 'CUS', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'CUS', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // RSC
            ['shape_name' => 'RSC', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'RSC', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'RSC', 'size' => '2.00', 'secondary_size' => '', 'description' => '', 'display_order' => 91, 'ctw' => 0.080],
        ];

        $count = 0;
        $skipped = 0;

        foreach ($shapeSizes as $sizeData) {
            $shape = $shapes->get($sizeData['shape_name']);

            if (!$shape) {
                $skipped++;
                $this->command->warn("Shape not found for: {$sizeData['shape_name']}");
                continue;
            }

            DiamondShapeSize::updateOrCreate(
                [
                    'diamond_shape_id' => $shape->id,
                    'size' => $sizeData['size'] ?: null,
                    'secondary_size' => $sizeData['secondary_size'] ?: null,
                ],
                [
                    'diamond_type_id' => $naturalType->id,
                    'description' => $sizeData['description'] ?: null,
                    'display_order' => $sizeData['display_order'],
                    'ctw' => $sizeData['ctw'],
                ]
            );
            $count++;
        }

        $this->command->info("Imported {$count} diamond shape sizes. Skipped {$skipped} due to missing shapes.");

        // Seed Fancy Color Diamond shape sizes from Excel file
        $this->command->info('Seeding Fancy Color Diamond shape sizes...');

        $fancyShapeSizes = [
            // UnGraded
            ['shape_name' => 'UnGraded', 'size' => 'UnGraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],

            // ASH
            ['shape_name' => 'ASH', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'ASH', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'ASH', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.180],
            ['shape_name' => 'ASH', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.700],
            ['shape_name' => 'ASH', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 1.650],
            ['shape_name' => 'ASH', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.860],
            ['shape_name' => 'ASH', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.330],
            ['shape_name' => 'ASH', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.585],
            ['shape_name' => 'ASH', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.675],

            // BUG
            ['shape_name' => 'BUG', 'size' => 'MIX', 'secondary_size' => '', 'description' => 'Mix', 'display_order' => 0, 'ctw' => 0.000],
            ['shape_name' => 'BUG', 'size' => '1.25x0.65(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.004],
            ['shape_name' => 'BUG', 'size' => '1.50x0.75(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.006],
            ['shape_name' => 'BUG', 'size' => '1.75x0.87(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.008],
            ['shape_name' => 'BUG', 'size' => '2.25x1.12(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.012],
            ['shape_name' => 'BUG', 'size' => '2.75x1.37(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.022],
            ['shape_name' => 'BUG', 'size' => '2.50x1.25(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.015],
            ['shape_name' => 'BUG', 'size' => '5.00x2.50(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.015],
            ['shape_name' => 'BUG', 'size' => '2.00x1.00(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.010],
            ['shape_name' => 'BUG', 'size' => '3.00x1.50(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.030],
            ['shape_name' => 'BUG', 'size' => '4.00x2.00(S)', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.013],
            ['shape_name' => 'BUG', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'BUG', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // CUS
            ['shape_name' => 'CUS', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'CUS', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // FBFD
            ['shape_name' => 'FBFD', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'FBFD', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'FBFD', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.220],
            ['shape_name' => 'FBFD', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.280],
            ['shape_name' => 'FBFD', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.480],
            ['shape_name' => 'FBFD', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.500],
            ['shape_name' => 'FBFD', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.950],
            ['shape_name' => 'FBFD', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 1.000],
            ['shape_name' => 'FBFD', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 1.500],
            ['shape_name' => 'FBFD', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 2.000],
            ['shape_name' => 'FBFD', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 2.500],
            ['shape_name' => 'FBFD', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 3.000],
            ['shape_name' => 'FBFD', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 3.550],
            ['shape_name' => 'FBFD', 'size' => '8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 4.000],
            ['shape_name' => 'FBFD', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 4.500],
            ['shape_name' => 'FBFD', 'size' => '2.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.035],
            ['shape_name' => 'FBFD', 'size' => '10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 5.500],
            ['shape_name' => 'FBFD', 'size' => '2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.055],

            // HBHD
            ['shape_name' => 'HBHD', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.280],
            ['shape_name' => 'HBHD', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.480],
            ['shape_name' => 'HBHD', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.950],
            ['shape_name' => 'HBHD', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 1.000],
            ['shape_name' => 'HBHD', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 1.500],
            ['shape_name' => 'HBHD', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 2.500],
            ['shape_name' => 'HBHD', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.220],
            ['shape_name' => 'HBHD', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.500],
            ['shape_name' => 'HBHD', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 3.550],
            ['shape_name' => 'HBHD', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 2.000],
            ['shape_name' => 'HBHD', 'size' => '10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 5.500],
            ['shape_name' => 'HBHD', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 3.000],
            ['shape_name' => 'HBHD', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'HBHD', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // OCT
            ['shape_name' => 'OCT', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'OCT', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'OCT', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'OCT', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'OCT', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.000],

            // OVL
            ['shape_name' => 'OVL', 'size' => '2.00x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.000],
            ['shape_name' => 'OVL', 'size' => '2.50x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.090],
            ['shape_name' => 'OVL', 'size' => '3.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.100],
            ['shape_name' => 'OVL', 'size' => '3.50x4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.210],
            ['shape_name' => 'OVL', 'size' => '3.50x5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.250],
            ['shape_name' => 'OVL', 'size' => '4.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.250],
            ['shape_name' => 'OVL', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.360],
            ['shape_name' => 'OVL', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 0.660],
            ['shape_name' => 'OVL', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 1.090],
            ['shape_name' => 'OVL', 'size' => '6.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 1.700],
            ['shape_name' => 'OVL', 'size' => '6.50x8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 1.360],
            ['shape_name' => 'OVL', 'size' => '7.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 1.670],
            ['shape_name' => 'OVL', 'size' => '8.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 2.420],
            ['shape_name' => 'OVL', 'size' => '9.00x11.00', 'secondary_size' => '', 'description' => '', 'display_order' => 18, 'ctw' => 3.370],
            ['shape_name' => 'OVL', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'OVL', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'OVL', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.170],
            ['shape_name' => 'OVL', 'size' => '2.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.130],

            // OVL-CB
            ['shape_name' => 'OVL-CB', 'size' => '4.00x5.00', 'secondary_size' => '', 'description' => 'NA', 'display_order' => 9, 'ctw' => 0.260],
            ['shape_name' => 'OVL-CB', 'size' => '3.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.130],
            ['shape_name' => 'OVL-CB', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'OVL-CB', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'OVL-CB', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.360],
            ['shape_name' => 'OVL-CB', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.600],
            ['shape_name' => 'OVL-CB', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.700],
            ['shape_name' => 'OVL-CB', 'size' => '7.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 1.000],
            ['shape_name' => 'OVL-CB', 'size' => '8.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 1.500],

            // PRI
            ['shape_name' => 'PRI', 'size' => '1.30', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.014],
            ['shape_name' => 'PRI', 'size' => '1.40', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.019],
            ['shape_name' => 'PRI', 'size' => '1.50', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.021],
            ['shape_name' => 'PRI', 'size' => '1.70', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.031],
            ['shape_name' => 'PRI', 'size' => '1.80', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.036],
            ['shape_name' => 'PRI', 'size' => '1.90', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.043],
            ['shape_name' => 'PRI', 'size' => '2.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.050],
            ['shape_name' => 'PRI', 'size' => '2.10', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.060],
            ['shape_name' => 'PRI', 'size' => '2.20', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.070],
            ['shape_name' => 'PRI', 'size' => '2.30', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.080],
            ['shape_name' => 'PRI', 'size' => '2.40', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 0.090],
            ['shape_name' => 'PRI', 'size' => '2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.100],
            ['shape_name' => 'PRI', 'size' => '2.70', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.120],
            ['shape_name' => 'PRI', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 0.170],
            ['shape_name' => 'PRI', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 0.270],
            ['shape_name' => 'PRI', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 0.400],
            ['shape_name' => 'PRI', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 18, 'ctw' => 0.600],
            ['shape_name' => 'PRI', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 19, 'ctw' => 0.780],
            ['shape_name' => 'PRI', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 20, 'ctw' => 0.000],
            ['shape_name' => 'PRI', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'PRI', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'PRI', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 21, 'ctw' => 1.350],
            ['shape_name' => 'PRI', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 22, 'ctw' => 2.150],
            ['shape_name' => 'PRI', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 23, 'ctw' => 2.500],
            ['shape_name' => 'PRI', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 24, 'ctw' => 4.000],
            ['shape_name' => 'PRI', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 25, 'ctw' => 4.570],

            // PRI-CB
            ['shape_name' => 'PRI-CB', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'PRI-CB', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'PRI-CB', 'size' => '4.80', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.440],
            ['shape_name' => 'PRI-CB', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.690],
            ['shape_name' => 'PRI-CB', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 2.300],

            // PRS
            ['shape_name' => 'PRS', 'size' => '1.50x2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.030],
            ['shape_name' => 'PRS', 'size' => '2.00x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.040],
            ['shape_name' => 'PRS', 'size' => '2.50x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.070],
            ['shape_name' => 'PRS', 'size' => '2.50x3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.080],
            ['shape_name' => 'PRS', 'size' => '2.50x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.090],
            ['shape_name' => 'PRS', 'size' => '3.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.130],
            ['shape_name' => 'PRS', 'size' => '3.00x4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.150],
            ['shape_name' => 'PRS', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.170],
            ['shape_name' => 'PRS', 'size' => '3.50x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.200],
            ['shape_name' => 'PRS', 'size' => '3.50x5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.250],
            ['shape_name' => 'PRS', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 0.350],
            ['shape_name' => 'PRS', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'PRS', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'PRS', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 22, 'ctw' => 0.650],
            ['shape_name' => 'PRS', 'size' => '5.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 23, 'ctw' => 0.750],
            ['shape_name' => 'PRS', 'size' => '5.50x8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 24, 'ctw' => 0.950],
            ['shape_name' => 'PRS', 'size' => '6.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 26, 'ctw' => 1.500],
            ['shape_name' => 'PRS', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 28, 'ctw' => 1.060],
            ['shape_name' => 'PRS', 'size' => '6.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 28, 'ctw' => 1.200],
            ['shape_name' => 'PRS', 'size' => '7.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 30, 'ctw' => 1.810],
            ['shape_name' => 'PRS', 'size' => '7.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 32, 'ctw' => 1.630],
            ['shape_name' => 'PRS', 'size' => '8.00x12.00', 'secondary_size' => '', 'description' => '', 'display_order' => 35, 'ctw' => 2.750],
            ['shape_name' => 'PRS', 'size' => '4.50x6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 20, 'ctw' => 0.480],
            ['shape_name' => 'PRS', 'size' => '5.50x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 25, 'ctw' => 0.000],
            ['shape_name' => 'PRS', 'size' => '10.00x15.00', 'secondary_size' => '', 'description' => '', 'display_order' => 40, 'ctw' => 0.000],
            ['shape_name' => 'PRS', 'size' => '3.50X4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.230],
            ['shape_name' => 'PRS', 'size' => 'MIX', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.000],

            // PRS-CB
            ['shape_name' => 'PRS-CB', 'size' => '3.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.150],
            ['shape_name' => 'PRS-CB', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.160],
            ['shape_name' => 'PRS-CB', 'size' => '3.50x5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.180],
            ['shape_name' => 'PRS-CB', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.190],
            ['shape_name' => 'PRS-CB', 'size' => '4.50x6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.195],
            ['shape_name' => 'PRS-CB', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.200],
            ['shape_name' => 'PRS-CB', 'size' => '5.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.250],
            ['shape_name' => 'PRS-CB', 'size' => '6.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.300],
            ['shape_name' => 'PRS-CB', 'size' => '7.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 1.000],
            ['shape_name' => 'PRS-CB', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'PRS-CB', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // RND
            ['shape_name' => 'RND', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'RND', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'RND', 'size' => '0.80', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.003],
            ['shape_name' => 'RND', 'size' => '0.90', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.004],
            ['shape_name' => 'RND', 'size' => '1.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.004],
            ['shape_name' => 'RND', 'size' => '1.10', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.005],
            ['shape_name' => 'RND', 'size' => '1.15', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.006],
            ['shape_name' => 'RND', 'size' => '1.20', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.007],
            ['shape_name' => 'RND', 'size' => '1.25', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.007],
            ['shape_name' => 'RND', 'size' => '1.30', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.008],
            ['shape_name' => 'RND', 'size' => '1.35', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.009],
            ['shape_name' => 'RND', 'size' => '1.40', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.010],
            ['shape_name' => 'RND', 'size' => '1.45', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 0.011],
            ['shape_name' => 'RND', 'size' => '1.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.013],
            ['shape_name' => 'RND', 'size' => '1.55', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.014],
            ['shape_name' => 'RND', 'size' => '1.60', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.015],
            ['shape_name' => 'RND', 'size' => '1.70', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 0.018],
            ['shape_name' => 'RND', 'size' => '1.80', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 0.022],
            ['shape_name' => 'RND', 'size' => '1.90', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 0.026],
            ['shape_name' => 'RND', 'size' => '2.00', 'secondary_size' => '', 'description' => '', 'display_order' => 18, 'ctw' => 0.030],
            ['shape_name' => 'RND', 'size' => '2.10', 'secondary_size' => '', 'description' => '', 'display_order' => 19, 'ctw' => 0.035],
            ['shape_name' => 'RND', 'size' => '2.20', 'secondary_size' => '', 'description' => '', 'display_order' => 20, 'ctw' => 0.040],
            ['shape_name' => 'RND', 'size' => '2.30', 'secondary_size' => '', 'description' => '', 'display_order' => 21, 'ctw' => 0.046],
            ['shape_name' => 'RND', 'size' => '2.40', 'secondary_size' => '', 'description' => '', 'display_order' => 24, 'ctw' => 0.050],
            ['shape_name' => 'RND', 'size' => '2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 25, 'ctw' => 0.060],
            ['shape_name' => 'RND', 'size' => '2.60', 'secondary_size' => '', 'description' => '', 'display_order' => 26, 'ctw' => 0.065],
            ['shape_name' => 'RND', 'size' => '2.70', 'secondary_size' => '', 'description' => '', 'display_order' => 26, 'ctw' => 0.070],
            ['shape_name' => 'RND', 'size' => '2.80', 'secondary_size' => '', 'description' => '', 'display_order' => 26, 'ctw' => 0.080],
            ['shape_name' => 'RND', 'size' => '2.90', 'secondary_size' => '', 'description' => '', 'display_order' => 27, 'ctw' => 0.090],
            ['shape_name' => 'RND', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 28, 'ctw' => 0.100],
            ['shape_name' => 'RND', 'size' => '3.10', 'secondary_size' => '', 'description' => '', 'display_order' => 29, 'ctw' => 0.110],
            ['shape_name' => 'RND', 'size' => '3.20', 'secondary_size' => '', 'description' => '', 'display_order' => 30, 'ctw' => 0.120],
            ['shape_name' => 'RND', 'size' => '3.30', 'secondary_size' => '', 'description' => '', 'display_order' => 31, 'ctw' => 0.130],
            ['shape_name' => 'RND', 'size' => '3.40', 'secondary_size' => '', 'description' => '', 'display_order' => 33, 'ctw' => 0.150],
            ['shape_name' => 'RND', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 33, 'ctw' => 0.160],
            ['shape_name' => 'RND', 'size' => '3.60', 'secondary_size' => '', 'description' => '', 'display_order' => 34, 'ctw' => 0.180],
            ['shape_name' => 'RND', 'size' => '3.80', 'secondary_size' => '', 'description' => '', 'display_order' => 35, 'ctw' => 0.210],
            ['shape_name' => 'RND', 'size' => '3.90', 'secondary_size' => '', 'description' => '', 'display_order' => 36, 'ctw' => 0.220],
            ['shape_name' => 'RND', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 36, 'ctw' => 0.250],
            ['shape_name' => 'RND', 'size' => '4.10', 'secondary_size' => '', 'description' => '', 'display_order' => 37, 'ctw' => 0.260],
            ['shape_name' => 'RND', 'size' => '4.20', 'secondary_size' => '', 'description' => '', 'display_order' => 38, 'ctw' => 0.280],
            ['shape_name' => 'RND', 'size' => '4.30', 'secondary_size' => '', 'description' => '', 'display_order' => 39, 'ctw' => 0.300],
            ['shape_name' => 'RND', 'size' => '4.40', 'secondary_size' => '', 'description' => '', 'display_order' => 41, 'ctw' => 0.330],
            ['shape_name' => 'RND', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 42, 'ctw' => 0.350],
            ['shape_name' => 'RND', 'size' => '4.70', 'secondary_size' => '', 'description' => '', 'display_order' => 43, 'ctw' => 0.390],
            ['shape_name' => 'RND', 'size' => '4.80', 'secondary_size' => '', 'description' => '', 'display_order' => 44, 'ctw' => 0.410],
            ['shape_name' => 'RND', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 45, 'ctw' => 0.470],
            ['shape_name' => 'RND', 'size' => '5.20', 'secondary_size' => '', 'description' => '', 'display_order' => 47, 'ctw' => 1.060],
            ['shape_name' => 'RND', 'size' => '5.30', 'secondary_size' => '', 'description' => '', 'display_order' => 48, 'ctw' => 1.120],
            ['shape_name' => 'RND', 'size' => '5.40', 'secondary_size' => '', 'description' => '', 'display_order' => 49, 'ctw' => 1.180],
            ['shape_name' => 'RND', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 50, 'ctw' => 1.200],
            ['shape_name' => 'RND', 'size' => '5.70', 'secondary_size' => '', 'description' => '', 'display_order' => 51, 'ctw' => 1.380],
            ['shape_name' => 'RND', 'size' => '5.80', 'secondary_size' => '', 'description' => '', 'display_order' => 52, 'ctw' => 1.460],
            ['shape_name' => 'RND', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 54, 'ctw' => 1.600],
            ['shape_name' => 'RND', 'size' => '6.25', 'secondary_size' => '', 'description' => '', 'display_order' => 55, 'ctw' => 1.800],
            ['shape_name' => 'RND', 'size' => '6.30', 'secondary_size' => '', 'description' => '', 'display_order' => 56, 'ctw' => 1.900],
            ['shape_name' => 'RND', 'size' => '6.40', 'secondary_size' => '', 'description' => '', 'display_order' => 57, 'ctw' => 1.960],
            ['shape_name' => 'RND', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 58, 'ctw' => 2.000],
            ['shape_name' => 'RND', 'size' => '6.60', 'secondary_size' => '', 'description' => '', 'display_order' => 59, 'ctw' => 2.200],
            ['shape_name' => 'RND', 'size' => '6.80', 'secondary_size' => '', 'description' => '', 'display_order' => 60, 'ctw' => 2.400],
            ['shape_name' => 'RND', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 61, 'ctw' => 2.600],
            ['shape_name' => 'RND', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 63, 'ctw' => 3.200],
            ['shape_name' => 'RND', 'size' => '7.80', 'secondary_size' => '', 'description' => '', 'display_order' => 64, 'ctw' => 3.600],
            ['shape_name' => 'RND', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 65, 'ctw' => 3.800],
            ['shape_name' => 'RND', 'size' => '8.20', 'secondary_size' => '', 'description' => '', 'display_order' => 66, 'ctw' => 4.000],
            ['shape_name' => 'RND', 'size' => '8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 68, 'ctw' => 4.600],
            ['shape_name' => 'RND', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 70, 'ctw' => 5.400],
            ['shape_name' => 'RND', 'size' => '10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 74, 'ctw' => 5.750],
            ['shape_name' => 'RND', 'size' => '12.00', 'secondary_size' => '', 'description' => '', 'display_order' => 78, 'ctw' => 6.450],
            ['shape_name' => 'RND', 'size' => '13.00', 'secondary_size' => '', 'description' => '', 'display_order' => 82, 'ctw' => 8.200],
            ['shape_name' => 'RND', 'size' => '17.50', 'secondary_size' => '', 'description' => '', 'display_order' => 89, 'ctw' => 20.000],
            ['shape_name' => 'RND', 'size' => '5.25', 'secondary_size' => '', 'description' => 'NA', 'display_order' => 1, 'ctw' => 0.520],
            ['shape_name' => 'RND', 'size' => 'MIX', 'secondary_size' => '', 'description' => 'Mix', 'display_order' => 1, 'ctw' => 0.000],

            // RND-CB
            ['shape_name' => 'RND-CB', 'size' => '2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.070],
            ['shape_name' => 'RND-CB', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.100],
            ['shape_name' => 'RND-CB', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.180],
            ['shape_name' => 'RND-CB', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.220],
            ['shape_name' => 'RND-CB', 'size' => '4.20', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.250],
            ['shape_name' => 'RND-CB', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.300],
            ['shape_name' => 'RND-CB', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.450],
            ['shape_name' => 'RND-CB', 'size' => '5.10', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 0.480],
            ['shape_name' => 'RND-CB', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 0.550],
            ['shape_name' => 'RND-CB', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.700],
            ['shape_name' => 'RND-CB', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.800],
            ['shape_name' => 'RND-CB', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 1.000],
            ['shape_name' => 'RND-CB', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 15, 'ctw' => 2.000],
            ['shape_name' => 'RND-CB', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 2.500],
            ['shape_name' => 'RND-CB', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'RND-CB', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // BAL
            ['shape_name' => 'BAL', 'size' => '2.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.035],
            ['shape_name' => 'BAL', 'size' => '2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.055],
            ['shape_name' => 'BAL', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 117, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 118, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 119, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 122, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 123, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 124, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 125, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 126, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 132, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 133, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 134, 'ctw' => 0.000],
            ['shape_name' => 'BAL', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 135, 'ctw' => 0.000],

            // CSN
            ['shape_name' => 'CSN', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'CSN', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'CSN', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.200],
            ['shape_name' => 'CSN', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.220],
            ['shape_name' => 'CSN', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.330],
            ['shape_name' => 'CSN', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.470],
            ['shape_name' => 'CSN', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.650],
            ['shape_name' => 'CSN', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.860],
            ['shape_name' => 'CSN', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 1.120],
            ['shape_name' => 'CSN', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 1.420],
            ['shape_name' => 'CSN', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 1.780],
            ['shape_name' => 'CSN', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 2.190],
            ['shape_name' => 'CSN', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 2.650],
            ['shape_name' => 'CSN', 'size' => '8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 3.190],
            ['shape_name' => 'CSN', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 4.000],
            ['shape_name' => 'CSN', 'size' => '9.50', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 4.450],
            ['shape_name' => 'CSN', 'size' => '10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 18, 'ctw' => 5.500],
            ['shape_name' => 'CSN', 'size' => '10.50', 'secondary_size' => '', 'description' => '', 'display_order' => 19, 'ctw' => 6.000],

            // CSN-CB
            ['shape_name' => 'CSN-CB', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.300],
            ['shape_name' => 'CSN-CB', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.400],
            ['shape_name' => 'CSN-CB', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.500],
            ['shape_name' => 'CSN-CB', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.650],
            ['shape_name' => 'CSN-CB', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.700],
            ['shape_name' => 'CSN-CB', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 1.000],
            ['shape_name' => 'CSN-CB', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'CSN-CB', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // DRFD
            ['shape_name' => 'DRFD', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'DRFD', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'DRFD', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.170],
            ['shape_name' => 'DRFD', 'size' => '3.50x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.200],
            ['shape_name' => 'DRFD', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.850],
            ['shape_name' => 'DRFD', 'size' => '4.50x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.900],
            ['shape_name' => 'DRFD', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.650],
            ['shape_name' => 'DRFD', 'size' => '5.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 1.100],
            ['shape_name' => 'DRFD', 'size' => '6.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 1.300],
            ['shape_name' => 'DRFD', 'size' => '7.00x12.00', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 2.170],
            ['shape_name' => 'DRFD', 'size' => '7.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 1.900],
            ['shape_name' => 'DRFD', 'size' => '9.00X12.00', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 7.215],

            // DRHD
            ['shape_name' => 'DRHD', 'size' => '5.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.950],
            ['shape_name' => 'DRHD', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.850],
            ['shape_name' => 'DRHD', 'size' => '5.50x8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 1.000],
            ['shape_name' => 'DRHD', 'size' => '9.00x12.00', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 0.000],
            ['shape_name' => 'DRHD', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.170],
            ['shape_name' => 'DRHD', 'size' => '3.50x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.200],
            ['shape_name' => 'DRHD', 'size' => '3.50x5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.250],
            ['shape_name' => 'DRHD', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.650],
            ['shape_name' => 'DRHD', 'size' => '4.50x6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.780],
            ['shape_name' => 'DRHD', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 1.100],
            ['shape_name' => 'DRHD', 'size' => '6.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 1.300],
            ['shape_name' => 'DRHD', 'size' => '7.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.000],
            ['shape_name' => 'DRHD', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'DRHD', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // EMR
            ['shape_name' => 'EMR', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'EMR', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'EMR', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.560],
            ['shape_name' => 'EMR', 'size' => '4.50x6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.760],
            ['shape_name' => 'EMR', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 1.020],
            ['shape_name' => 'EMR', 'size' => '5.50x7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 1.310],
            ['shape_name' => 'EMR', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 1.670],
            ['shape_name' => 'EMR', 'size' => '6.50x8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 2.080],
            ['shape_name' => 'EMR', 'size' => '7.00x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 2.560],
            ['shape_name' => 'EMR', 'size' => '2.00x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.700],
            ['shape_name' => 'EMR', 'size' => '2.50x3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.130],
            ['shape_name' => 'EMR', 'size' => '3.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.300],
            ['shape_name' => 'EMR', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.400],
            ['shape_name' => 'EMR', 'size' => '4.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.470],
            ['shape_name' => 'EMR', 'size' => '8.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 3.700],

            // EMR-CB
            ['shape_name' => 'EMR-CB', 'size' => '6.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 1.000],
            ['shape_name' => 'EMR-CB', 'size' => '3.00x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.150],
            ['shape_name' => 'EMR-CB', 'size' => '4.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.300],
            ['shape_name' => 'EMR-CB', 'size' => '5.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.500],
            ['shape_name' => 'EMR-CB', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'EMR-CB', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // FBHD
            ['shape_name' => 'FBHD', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'FBHD', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'FBHD', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.480],
            ['shape_name' => 'FBHD', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.500],
            ['shape_name' => 'FBHD', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.950],
            ['shape_name' => 'FBHD', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 1.000],
            ['shape_name' => 'FBHD', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 1.500],
            ['shape_name' => 'FBHD', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 2.000],
            ['shape_name' => 'FBHD', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 2.500],
            ['shape_name' => 'FBHD', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 3.000],
            ['shape_name' => 'FBHD', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 3.550],
            ['shape_name' => 'FBHD', 'size' => '8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 4.000],
            ['shape_name' => 'FBHD', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 4.500],
            ['shape_name' => 'FBHD', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.280],
            ['shape_name' => 'FBHD', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.220],
            ['shape_name' => 'FBHD', 'size' => '2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.090],

            // HBFD
            ['shape_name' => 'HBFD', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.220],
            ['shape_name' => 'HBFD', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.280],
            ['shape_name' => 'HBFD', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.480],
            ['shape_name' => 'HBFD', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.500],
            ['shape_name' => 'HBFD', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.950],
            ['shape_name' => 'HBFD', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 1.000],
            ['shape_name' => 'HBFD', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 1.500],
            ['shape_name' => 'HBFD', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 2.000],
            ['shape_name' => 'HBFD', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 2.500],
            ['shape_name' => 'HBFD', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 10, 'ctw' => 3.000],
            ['shape_name' => 'HBFD', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 3.550],
            ['shape_name' => 'HBFD', 'size' => '8.50', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 4.000],
            ['shape_name' => 'HBFD', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 4.500],
            ['shape_name' => 'HBFD', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'HBFD', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // HRT
            ['shape_name' => 'HRT', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'HRT', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'HRT', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 0.850],
            ['shape_name' => 'HRT', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.500],
            ['shape_name' => 'HRT', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.270],
            ['shape_name' => 'HRT', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.120],
            ['shape_name' => 'HRT', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 1.850],
            ['shape_name' => 'HRT', 'size' => '3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.180],
            ['shape_name' => 'HRT', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.350],
            ['shape_name' => 'HRT', 'size' => '5.50', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.600],
            ['shape_name' => 'HRT', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 1.000],

            // MRQ
            ['shape_name' => 'MRQ', 'size' => '6.00x12.00', 'secondary_size' => '', 'description' => '', 'display_order' => 20, 'ctw' => 1.410],
            ['shape_name' => 'MRQ', 'size' => '7.00x14.00', 'secondary_size' => '', 'description' => '', 'display_order' => 21, 'ctw' => 0.000],
            ['shape_name' => 'MRQ', 'size' => '1.50x2.50', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.018],
            ['shape_name' => 'MRQ', 'size' => '2.00x3.50', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 0.045],
            ['shape_name' => 'MRQ', 'size' => '4.00x7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 16, 'ctw' => 0.350],
            ['shape_name' => 'MRQ', 'size' => '1.50x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.022],
            ['shape_name' => 'MRQ', 'size' => '2.00x3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.039],
            ['shape_name' => 'MRQ', 'size' => '2.00x4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 9, 'ctw' => 0.050],
            ['shape_name' => 'MRQ', 'size' => '2.50x5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 11, 'ctw' => 0.100],
            ['shape_name' => 'MRQ', 'size' => '3.00x6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 12, 'ctw' => 0.180],
            ['shape_name' => 'MRQ', 'size' => '3.00x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 13, 'ctw' => 0.200],
            ['shape_name' => 'MRQ', 'size' => '3.50x7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 14, 'ctw' => 0.280],
            ['shape_name' => 'MRQ', 'size' => '4.00x8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 17, 'ctw' => 0.420],
            ['shape_name' => 'MRQ', 'size' => '4.50x9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 18, 'ctw' => 0.600],
            ['shape_name' => 'MRQ', 'size' => '5.00x10.00', 'secondary_size' => '', 'description' => '', 'display_order' => 19, 'ctw' => 0.820],
            ['shape_name' => 'MRQ', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'MRQ', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],

            // TRI
            ['shape_name' => 'TRI', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'TRI', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
            ['shape_name' => 'TRI', 'size' => '3.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.150],
            ['shape_name' => 'TRI', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.230],
            ['shape_name' => 'TRI', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.330],
            ['shape_name' => 'TRI', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.420],
            ['shape_name' => 'TRI', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 1.100],
            ['shape_name' => 'TRI', 'size' => '9.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 2.350],

            // TRL
            ['shape_name' => 'TRL', 'size' => '4.00', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.200],
            ['shape_name' => 'TRL', 'size' => '4.50', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.220],
            ['shape_name' => 'TRL', 'size' => '5.00', 'secondary_size' => '', 'description' => '', 'display_order' => 3, 'ctw' => 0.350],
            ['shape_name' => 'TRL', 'size' => '6.00', 'secondary_size' => '', 'description' => '', 'display_order' => 4, 'ctw' => 0.600],
            ['shape_name' => 'TRL', 'size' => '6.50', 'secondary_size' => '', 'description' => '', 'display_order' => 5, 'ctw' => 0.770],
            ['shape_name' => 'TRL', 'size' => '7.00', 'secondary_size' => '', 'description' => '', 'display_order' => 6, 'ctw' => 0.950],
            ['shape_name' => 'TRL', 'size' => '7.50', 'secondary_size' => '', 'description' => '', 'display_order' => 7, 'ctw' => 1.000],
            ['shape_name' => 'TRL', 'size' => '8.00', 'secondary_size' => '', 'description' => '', 'display_order' => 8, 'ctw' => 1.430],
            ['shape_name' => 'TRL', 'size' => 'Ungraded', 'secondary_size' => '', 'description' => '', 'display_order' => 1, 'ctw' => 0.000],
            ['shape_name' => 'TRL', 'size' => 'Custom', 'secondary_size' => '', 'description' => '', 'display_order' => 2, 'ctw' => 0.000],
        ];

        $fancyCount = 0;
        $fancySkipped = 0;

        foreach ($fancyShapeSizes as $sizeData) {
            $shape = $shapes->get($sizeData['shape_name']);

            if (!$shape) {
                $fancySkipped++;
                $this->command->warn("Fancy shape not found for: {$sizeData['shape_name']}");
                continue;
            }

            DiamondShapeSize::updateOrCreate(
                [
                    'diamond_shape_id' => $shape->id,
                    'size' => $sizeData['size'] ?: null,
                    'secondary_size' => $sizeData['secondary_size'] ?: null,
                ],
                [
                    'diamond_type_id' => $fancyType->id,
                    'description' => $sizeData['description'] ?: null,
                    'display_order' => $sizeData['display_order'],
                    'ctw' => $sizeData['ctw'],
                ]
            );
            $fancyCount++;
        }

        $this->command->info("Imported {$fancyCount} Fancy Color Diamond shape sizes. Skipped {$fancySkipped} due to missing shapes.");
    }

    protected function seedDiamonds(): void
    {
        $this->command->info('Seeding diamonds...');

        // Get reference data
        $naturalType = DiamondType::where('code', 'NAT')->first();

        if (!$naturalType) {
            $this->command->error('Natural Diamond type not found. Please seed diamond types first.');
            return;
        }

        $clarities = DiamondClarity::where('is_active', true)->get()->keyBy('name');
        $colors = DiamondColor::where('is_active', true)->get()->keyBy('name');
        $shapes = DiamondShape::where('is_active', true)->get()->keyBy('name');
        $shapeSizes = DiamondShapeSize::all()->groupBy('diamond_shape_id');

        // Common combinations for dummy data
        $diamondData = [
            // Round diamonds - various qualities
            ['shape' => 'RND', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '1.00', 'weight' => 1.000, 'price' => 5000.00, 'name' => 'Round VVS DEF 1.00ct'],
            ['shape' => 'RND', 'color' => 'DEF', 'clarity' => 'VS', 'size' => '1.00', 'weight' => 1.000, 'price' => 4500.00, 'name' => 'Round VS DEF 1.00ct'],
            ['shape' => 'RND', 'color' => 'EF', 'clarity' => 'VVS', 'size' => '1.50', 'weight' => 1.500, 'price' => 7500.00, 'name' => 'Round VVS EF 1.50ct'],
            ['shape' => 'RND', 'color' => 'GH', 'clarity' => 'VS', 'size' => '2.00', 'weight' => 2.000, 'price' => 12000.00, 'name' => 'Round VS GH 2.00ct'],
            ['shape' => 'RND', 'color' => 'DEF', 'clarity' => 'VVS1', 'size' => '3.00', 'weight' => 3.000, 'price' => 25000.00, 'name' => 'Round VVS1 DEF 3.00ct'],
            ['shape' => 'RND', 'color' => 'FG', 'clarity' => 'SI', 'size' => '0.90', 'weight' => 0.900, 'price' => 3500.00, 'name' => 'Round SI FG 0.90ct'],
            ['shape' => 'RND', 'color' => 'HI', 'clarity' => 'VS', 'size' => '1.25', 'weight' => 1.250, 'price' => 5500.00, 'name' => 'Round VS HI 1.25ct'],
            ['shape' => 'RND', 'color' => 'DEF', 'clarity' => 'VVS-VS', 'size' => '1.80', 'weight' => 1.800, 'price' => 8500.00, 'name' => 'Round VVS-VS DEF 1.80ct'],

            // Princess cut diamonds
            ['shape' => 'PRI', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '1.00', 'weight' => 1.000, 'price' => 4800.00, 'name' => 'Princess VVS DEF 1.00ct'],
            ['shape' => 'PRI', 'color' => 'EF', 'clarity' => 'VS', 'size' => '1.50', 'weight' => 1.500, 'price' => 7000.00, 'name' => 'Princess VS EF 1.50ct'],
            ['shape' => 'PRI', 'color' => 'GH', 'clarity' => 'SI', 'size' => '2.00', 'weight' => 2.000, 'price' => 10000.00, 'name' => 'Princess SI GH 2.00ct'],
            ['shape' => 'PRI', 'color' => 'FG', 'clarity' => 'VVS', 'size' => '2.50', 'weight' => 2.500, 'price' => 15000.00, 'name' => 'Princess VVS FG 2.50ct'],

            // Emerald cut diamonds
            ['shape' => 'EMR', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '3.00x4.00', 'weight' => 0.200, 'price' => 22000.00, 'name' => 'Emerald VVS DEF 3.00x4.00'],
            ['shape' => 'EMR', 'color' => 'EF', 'clarity' => 'VS', 'size' => '4.00x5.00', 'weight' => 0.450, 'price' => 28000.00, 'name' => 'Emerald VS EF 4.00x5.00'],
            ['shape' => 'EMR', 'color' => 'GH', 'clarity' => 'VVS', 'size' => '5.00x7.00', 'weight' => 1.000, 'price' => 45000.00, 'name' => 'Emerald VVS GH 5.00x7.00'],

            // Cushion cut diamonds
            ['shape' => 'CSN', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '3.00', 'weight' => 0.150, 'price' => 20000.00, 'name' => 'Cushion VVS DEF 3.00ct'],
            ['shape' => 'CSN', 'color' => 'EF', 'clarity' => 'VS', 'size' => '4.00', 'weight' => 0.300, 'price' => 30000.00, 'name' => 'Cushion VS EF 4.00ct'],
            ['shape' => 'CSN', 'color' => 'GH', 'clarity' => 'SI', 'size' => '5.00', 'weight' => 0.500, 'price' => 40000.00, 'name' => 'Cushion SI GH 5.00ct'],

            // Marquise cut diamonds
            ['shape' => 'MRQ', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '2.00x3.00', 'weight' => 0.150, 'price' => 15000.00, 'name' => 'Marquise VVS DEF 2.00x3.00'],
            ['shape' => 'MRQ', 'color' => 'EF', 'clarity' => 'VS', 'size' => '3.00x5.00', 'weight' => 0.250, 'price' => 25000.00, 'name' => 'Marquise VS EF 3.00x5.00'],

            // Oval cut diamonds
            ['shape' => 'OVL', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '3.00x4.00', 'weight' => 0.200, 'price' => 21000.00, 'name' => 'Oval VVS DEF 3.00x4.00'],
            ['shape' => 'OVL', 'color' => 'EF', 'clarity' => 'VS', 'size' => '4.00x6.00', 'weight' => 0.500, 'price' => 35000.00, 'name' => 'Oval VS EF 4.00x6.00'],

            // Heart cut diamonds
            ['shape' => 'HRT', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '3.00', 'weight' => 0.150, 'price' => 22000.00, 'name' => 'Heart VVS DEF 3.00ct'],
            ['shape' => 'HRT', 'color' => 'EF', 'clarity' => 'VS', 'size' => '4.00', 'weight' => 0.300, 'price' => 32000.00, 'name' => 'Heart VS EF 4.00ct'],

            // Pear cut diamonds
            ['shape' => 'PRS', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '2.00x3.00', 'weight' => 0.048, 'price' => 16000.00, 'name' => 'Pear VVS DEF 2.00x3.00'],
            ['shape' => 'PRS', 'color' => 'EF', 'clarity' => 'VS', 'size' => '3.00x5.00', 'weight' => 0.250, 'price' => 28000.00, 'name' => 'Pear VS EF 3.00x5.00'],

            // Asscher cut diamonds
            ['shape' => 'ASH', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '3.00', 'weight' => 0.150, 'price' => 21000.00, 'name' => 'Asscher VVS DEF 3.00ct'],
            ['shape' => 'ASH', 'color' => 'EF', 'clarity' => 'VS', 'size' => '4.00', 'weight' => 0.390, 'price' => 31000.00, 'name' => 'Asscher VS EF 4.00ct'],

            // Baguette diamonds
            ['shape' => 'BUG', 'color' => 'DEF', 'clarity' => 'VVS', 'size' => '2.00x1.00(S)', 'weight' => 0.050, 'price' => 8000.00, 'name' => 'Baguette VVS DEF 2.00x1.00'],
            ['shape' => 'BUG', 'color' => 'EF', 'clarity' => 'VS', 'size' => '3.00x1.50(S)', 'weight' => 0.100, 'price' => 12000.00, 'name' => 'Baguette VS EF 3.00x1.50'],

            // Lab grown diamonds
            ['shape' => 'RND', 'color' => 'DEF', 'clarity' => 'C-VVS', 'size' => '1.00', 'weight' => 1.000, 'price' => 3000.00, 'name' => 'Lab Grown Round C-VVS DEF 1.00ct'],
            ['shape' => 'RND', 'color' => 'EF', 'clarity' => 'C-VS', 'size' => '1.50', 'weight' => 1.500, 'price' => 4500.00, 'name' => 'Lab Grown Round C-VS EF 1.50ct'],
            ['shape' => 'PRI', 'color' => 'GH', 'clarity' => 'C-VVS-VS', 'size' => '2.00', 'weight' => 2.000, 'price' => 6000.00, 'name' => 'Lab Grown Princess C-VVS-VS GH 2.00ct'],

            // Lower quality options
            ['shape' => 'RND', 'color' => 'IJ', 'clarity' => 'SI', 'size' => '1.00', 'weight' => 1.000, 'price' => 2500.00, 'name' => 'Round SI IJ 1.00ct'],
            ['shape' => 'RND', 'color' => 'JK', 'clarity' => 'I1', 'size' => '1.00', 'weight' => 1.000, 'price' => 1500.00, 'name' => 'Round I1 JK 1.00ct'],
            ['shape' => 'PRI', 'color' => 'HI', 'clarity' => 'SI2', 'size' => '1.50', 'weight' => 1.500, 'price' => 3500.00, 'name' => 'Princess SI2 HI 1.50ct'],
        ];

        $count = 0;
        $skipped = 0;

        foreach ($diamondData as $diamond) {
            $shape = $shapes->get($diamond['shape']);
            $color = $colors->get($diamond['color']);
            $clarity = $clarities->get($diamond['clarity']);

            if (!$shape || !$color || !$clarity) {
                $skipped++;
                $this->command->warn("Missing reference data for: {$diamond['name']}");
                continue;
            }

            // Find matching shape size
            $shapeSize = null;
            if (isset($shapeSizes[$shape->id])) {
                $shapeSize = $shapeSizes[$shape->id]->firstWhere('size', $diamond['size']);
            }

            if (!$shapeSize) {
                $skipped++;
                $this->command->warn("Missing shape size for: {$diamond['name']} (size: {$diamond['size']})");
                continue;
            }

            Diamond::updateOrCreate(
                [
                    'name' => $diamond['name'],
                    'diamond_shape_id' => $shape->id,
                    'diamond_color_id' => $color->id,
                    'diamond_clarity_id' => $clarity->id,
                ],
                [
                    'diamond_type_id' => $naturalType->id,
                    'diamond_shape_size_id' => $shapeSize->id,
                    'weight' => $diamond['weight'],
                    'price' => $diamond['price'],
                    'description' => "Premium {$diamond['shape']} cut diamond with {$diamond['color']} color and {$diamond['clarity']} clarity.",
                    'is_active' => true,
                ]
            );
            $count++;
        }

        $this->command->info("Imported {$count} diamonds. Skipped {$skipped} due to missing reference data.");

        // Seed Fancy Color Diamond dummy data
        $this->command->info('Seeding Fancy Color Diamond dummy data...');

        $fancyType = DiamondType::where('code', 'FANCY')->first();

        if (!$fancyType) {
            $this->command->error('Fancy Color Diamond type not found. Please seed diamond types first.');
            return;
        }

        // Get Fancy Color Diamond specific data
        $fancyClarities = DiamondClarity::where('diamond_type_id', $fancyType->id)->where('is_active', true)->get()->keyBy('name');
        $fancyColors = DiamondColor::where('diamond_type_id', $fancyType->id)->where('is_active', true)->get()->keyBy('name');
        $fancyShapes = DiamondShape::where('diamond_type_id', $fancyType->id)->where('is_active', true)->get()->keyBy('name');
        $fancyShapeSizes = DiamondShapeSize::where('diamond_type_id', $fancyType->id)->get()->groupBy('diamond_shape_id');

        $fancyDiamondData = [
            // Round Fancy Color Diamonds
            ['shape' => 'RND', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '1.00', 'weight' => 1.000, 'price' => 6000.00, 'name' => 'Fancy Yellow Round CUS 1.00ct'],
            ['shape' => 'RND', 'color' => 'YLW', 'clarity' => 'CER', 'size' => '1.50', 'weight' => 1.500, 'price' => 9000.00, 'name' => 'Fancy Yellow Round CER 1.50ct'],
            ['shape' => 'RND', 'color' => 'PNK', 'clarity' => 'CUS', 'size' => '2.00', 'weight' => 2.000, 'price' => 15000.00, 'name' => 'Fancy Pink Round CUS 2.00ct'],
            ['shape' => 'RND', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '2.50', 'weight' => 2.500, 'price' => 25000.00, 'name' => 'Fancy Blue Round N-EMR 2.50ct'],
            ['shape' => 'RND', 'color' => 'GRN', 'clarity' => 'S-EMR', 'size' => '3.00', 'weight' => 3.000, 'price' => 30000.00, 'name' => 'Fancy Green Round S-EMR 3.00ct'],
            ['shape' => 'RND', 'color' => 'RED', 'clarity' => 'N-RUB', 'size' => '1.00', 'weight' => 1.000, 'price' => 20000.00, 'name' => 'Fancy Red Round N-RUB 1.00ct'],
            ['shape' => 'RND', 'color' => 'ORC', 'clarity' => 'S-CIT', 'size' => '1.50', 'weight' => 1.500, 'price' => 8000.00, 'name' => 'Fancy Orange Round S-CIT 1.50ct'],
            ['shape' => 'RND', 'color' => 'PUR', 'clarity' => 'N-AME', 'size' => '2.00', 'weight' => 2.000, 'price' => 18000.00, 'name' => 'Fancy Purple Round N-AME 2.00ct'],

            // Princess Fancy Color Diamonds
            ['shape' => 'PRI', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '1.30', 'weight' => 0.014, 'price' => 5500.00, 'name' => 'Fancy Yellow Princess CUS 1.30'],
            ['shape' => 'PRI', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '2.00', 'weight' => 0.050, 'price' => 14000.00, 'name' => 'Fancy Pink Princess CER 2.00'],
            ['shape' => 'PRI', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '2.50', 'weight' => 0.100, 'price' => 22000.00, 'name' => 'Fancy Blue Princess N-EMR 2.50'],
            ['shape' => 'PRI', 'color' => 'GRN', 'clarity' => 'S-EMR', 'size' => '3.00', 'weight' => 0.170, 'price' => 28000.00, 'name' => 'Fancy Green Princess S-EMR 3.00'],
            ['shape' => 'PRI', 'color' => 'YLW', 'clarity' => 'N-GRT', 'size' => '4.00', 'weight' => 0.400, 'price' => 35000.00, 'name' => 'Fancy Yellow Princess N-GRT 4.00'],

            // Oval Fancy Color Diamonds
            ['shape' => 'OVL', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '3.00x4.00', 'weight' => 0.300, 'price' => 18000.00, 'name' => 'Fancy Yellow Oval CUS 3.00x4.00'],
            ['shape' => 'OVL', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '4.00x6.00', 'weight' => 0.360, 'price' => 32000.00, 'name' => 'Fancy Pink Oval CER 4.00x6.00'],
            ['shape' => 'OVL', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '5.00x7.00', 'weight' => 0.660, 'price' => 45000.00, 'name' => 'Fancy Blue Oval N-EMR 5.00x7.00'],
            ['shape' => 'OVL', 'color' => 'GRN', 'clarity' => 'S-EMR', 'size' => '6.00x8.00', 'weight' => 1.090, 'price' => 55000.00, 'name' => 'Fancy Green Oval S-EMR 6.00x8.00'],

            // Emerald Fancy Color Diamonds
            ['shape' => 'EMR', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '3.00x4.00', 'weight' => 0.300, 'price' => 20000.00, 'name' => 'Fancy Yellow Emerald CUS 3.00x4.00'],
            ['shape' => 'EMR', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '4.00x6.00', 'weight' => 0.560, 'price' => 38000.00, 'name' => 'Fancy Pink Emerald CER 4.00x6.00'],
            ['shape' => 'EMR', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '5.00x7.00', 'weight' => 1.020, 'price' => 52000.00, 'name' => 'Fancy Blue Emerald N-EMR 5.00x7.00'],
            ['shape' => 'EMR', 'color' => 'GRN', 'clarity' => 'S-EMR', 'size' => '6.00x8.00', 'weight' => 1.670, 'price' => 65000.00, 'name' => 'Fancy Green Emerald S-EMR 6.00x8.00'],

            // Cushion Fancy Color Diamonds
            ['shape' => 'CSN', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '3.00', 'weight' => 0.200, 'price' => 12000.00, 'name' => 'Fancy Yellow Cushion CUS 3.00'],
            ['shape' => 'CSN', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '4.00', 'weight' => 0.330, 'price' => 28000.00, 'name' => 'Fancy Pink Cushion CER 4.00'],
            ['shape' => 'CSN', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '5.00', 'weight' => 0.650, 'price' => 42000.00, 'name' => 'Fancy Blue Cushion N-EMR 5.00'],
            ['shape' => 'CSN', 'color' => 'GRN', 'clarity' => 'S-EMR', 'size' => '6.00', 'weight' => 1.120, 'price' => 58000.00, 'name' => 'Fancy Green Cushion S-EMR 6.00'],

            // Marquise Fancy Color Diamonds
            ['shape' => 'MRQ', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '1.50x2.50', 'weight' => 0.018, 'price' => 8000.00, 'name' => 'Fancy Yellow Marquise CUS 1.50x2.50'],
            ['shape' => 'MRQ', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '2.00x3.00', 'weight' => 0.039, 'price' => 15000.00, 'name' => 'Fancy Pink Marquise CER 2.00x3.00'],
            ['shape' => 'MRQ', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '3.00x6.00', 'weight' => 0.180, 'price' => 35000.00, 'name' => 'Fancy Blue Marquise N-EMR 3.00x6.00'],
            ['shape' => 'MRQ', 'color' => 'GRN', 'clarity' => 'S-EMR', 'size' => '4.00x8.00', 'weight' => 0.420, 'price' => 48000.00, 'name' => 'Fancy Green Marquise S-EMR 4.00x8.00'],

            // Pear Fancy Color Diamonds
            ['shape' => 'PRS', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '1.50x2.50', 'weight' => 0.030, 'price' => 7000.00, 'name' => 'Fancy Yellow Pear CUS 1.50x2.50'],
            ['shape' => 'PRS', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '2.00x3.00', 'weight' => 0.040, 'price' => 13000.00, 'name' => 'Fancy Pink Pear CER 2.00x3.00'],
            ['shape' => 'PRS', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '3.00x5.00', 'weight' => 0.170, 'price' => 32000.00, 'name' => 'Fancy Blue Pear N-EMR 3.00x5.00'],
            ['shape' => 'PRS', 'color' => 'GRN', 'clarity' => 'S-EMR', 'size' => '4.00x6.00', 'weight' => 0.350, 'price' => 45000.00, 'name' => 'Fancy Green Pear S-EMR 4.00x6.00'],

            // Heart Fancy Color Diamonds
            ['shape' => 'HRT', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '3.00', 'weight' => 0.120, 'price' => 10000.00, 'name' => 'Fancy Yellow Heart CUS 3.00'],
            ['shape' => 'HRT', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '4.00', 'weight' => 0.270, 'price' => 25000.00, 'name' => 'Fancy Pink Heart CER 4.00'],
            ['shape' => 'HRT', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '5.00', 'weight' => 0.500, 'price' => 40000.00, 'name' => 'Fancy Blue Heart N-EMR 5.00'],

            // Asscher Fancy Color Diamonds
            ['shape' => 'ASH', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '3.50', 'weight' => 0.180, 'price' => 11000.00, 'name' => 'Fancy Yellow Asscher CUS 3.50'],
            ['shape' => 'ASH', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '4.00', 'weight' => 0.330, 'price' => 26000.00, 'name' => 'Fancy Pink Asscher CER 4.00'],
            ['shape' => 'ASH', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '5.00', 'weight' => 0.700, 'price' => 43000.00, 'name' => 'Fancy Blue Asscher N-EMR 5.00'],

            // Baguette Fancy Color Diamonds
            ['shape' => 'BUG', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '2.00x1.00(S)', 'weight' => 0.010, 'price' => 5000.00, 'name' => 'Fancy Yellow Baguette CUS 2.00x1.00'],
            ['shape' => 'BUG', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '3.00x1.50(S)', 'weight' => 0.030, 'price' => 12000.00, 'name' => 'Fancy Pink Baguette CER 3.00x1.50'],

            // Round-CB Fancy Color Diamonds
            ['shape' => 'RND-CB', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '3.00', 'weight' => 0.100, 'price' => 9000.00, 'name' => 'Fancy Yellow Round-CB CUS 3.00'],
            ['shape' => 'RND-CB', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '4.00', 'weight' => 0.220, 'price' => 20000.00, 'name' => 'Fancy Pink Round-CB CER 4.00'],
            ['shape' => 'RND-CB', 'color' => 'BLU', 'clarity' => 'N-EMR', 'size' => '5.00', 'weight' => 0.450, 'price' => 38000.00, 'name' => 'Fancy Blue Round-CB N-EMR 5.00'],

            // Princess-CB Fancy Color Diamonds
            ['shape' => 'PRI-CB', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '4.80', 'weight' => 0.440, 'price' => 32000.00, 'name' => 'Fancy Yellow Princess-CB CUS 4.80'],
            ['shape' => 'PRI-CB', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '5.50', 'weight' => 0.690, 'price' => 45000.00, 'name' => 'Fancy Pink Princess-CB CER 5.50'],

            // Cushion-CB Fancy Color Diamonds
            ['shape' => 'CSN-CB', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '4.00', 'weight' => 0.300, 'price' => 22000.00, 'name' => 'Fancy Yellow Cushion-CB CUS 4.00'],
            ['shape' => 'CSN-CB', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '5.00', 'weight' => 0.500, 'price' => 35000.00, 'name' => 'Fancy Pink Cushion-CB CER 5.00'],

            // Emerald-CB Fancy Color Diamonds
            ['shape' => 'EMR-CB', 'color' => 'YLW', 'clarity' => 'CUS', 'size' => '3.00x5.00', 'weight' => 0.150, 'price' => 15000.00, 'name' => 'Fancy Yellow Emerald-CB CUS 3.00x5.00'],
            ['shape' => 'EMR-CB', 'color' => 'PNK', 'clarity' => 'CER', 'size' => '4.00x6.00', 'weight' => 0.300, 'price' => 30000.00, 'name' => 'Fancy Pink Emerald-CB CER 4.00x6.00'],

            // Special colors - Brown, Gray, etc.
            ['shape' => 'RND', 'color' => 'BRW', 'clarity' => 'CUS', 'size' => '2.00', 'weight' => 2.000, 'price' => 8000.00, 'name' => 'Fancy Brown Round CUS 2.00ct'],
            ['shape' => 'RND', 'color' => 'GRY', 'clarity' => 'CER', 'size' => '1.50', 'weight' => 1.500, 'price' => 7000.00, 'name' => 'Fancy Gray Round CER 1.50ct'],
            ['shape' => 'PRI', 'color' => 'BRW', 'clarity' => 'N-EMR', 'size' => '2.00', 'weight' => 0.050, 'price' => 9000.00, 'name' => 'Fancy Brown Princess N-EMR 2.00'],
        ];

        $fancyCount = 0;
        $fancySkipped = 0;

        foreach ($fancyDiamondData as $diamond) {
            $shape = $fancyShapes->get($diamond['shape']);
            $color = $fancyColors->get($diamond['color']);
            $clarity = $fancyClarities->get($diamond['clarity']);

            if (!$shape || !$color || !$clarity) {
                $fancySkipped++;
                $this->command->warn("Missing Fancy reference data for: {$diamond['name']} (Shape: {$diamond['shape']}, Color: {$diamond['color']}, Clarity: {$diamond['clarity']})");
                continue;
            }

            // Find matching shape size
            $shapeSize = null;
            if (isset($fancyShapeSizes[$shape->id])) {
                $shapeSize = $fancyShapeSizes[$shape->id]->firstWhere('size', $diamond['size']);
            }

            if (!$shapeSize) {
                $fancySkipped++;
                $this->command->warn("Missing Fancy shape size for: {$diamond['name']} (size: {$diamond['size']})");
                continue;
            }

            Diamond::updateOrCreate(
                [
                    'name' => $diamond['name'],
                    'diamond_shape_id' => $shape->id,
                    'diamond_color_id' => $color->id,
                    'diamond_clarity_id' => $clarity->id,
                ],
                [
                    'diamond_type_id' => $fancyType->id,
                    'diamond_shape_size_id' => $shapeSize->id,
                    'weight' => $diamond['weight'],
                    'price' => $diamond['price'],
                    'description' => "Premium Fancy Color {$diamond['shape']} cut diamond with {$diamond['color']} color and {$diamond['clarity']} clarity.",
                    'is_active' => true,
                ]
            );
            $fancyCount++;
        }

        $this->command->info("Imported {$fancyCount} Fancy Color Diamonds. Skipped {$fancySkipped} due to missing reference data.");
    }
}
