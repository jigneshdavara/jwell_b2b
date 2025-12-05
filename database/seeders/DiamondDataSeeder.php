<?php

namespace Database\Seeders;

use App\Models\DiamondClarity;
use App\Models\DiamondColor;
use App\Models\DiamondShape;
use App\Models\DiamondShapeSize;
use Illuminate\Database\Seeder;

class DiamondDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedDiamondClarities();
        $this->seedDiamondColors();
        $this->seedDiamondShapes();
        $this->seedDiamondShapeSizes();
    }

    protected function seedDiamondClarities(): void
    {
        $this->command->info('Seeding diamond clarities...');

        $clarities = [
            ['code' => 'A1', 'name' => 'A1', 'ecat_name' => 'A1', 'description' => '', 'display_order' => 1],
            ['code' => 'A2', 'name' => 'A2', 'ecat_name' => 'A2', 'description' => '', 'display_order' => 2],
            ['code' => 'A3', 'name' => 'A3', 'ecat_name' => 'A3', 'description' => '', 'display_order' => 3],
            ['code' => 'A4', 'name' => 'A4', 'ecat_name' => 'A4', 'description' => '', 'display_order' => 4],
            ['code' => 'I', 'name' => 'I', 'ecat_name' => 'Included', 'description' => '', 'display_order' => 5],
            ['code' => 'I1', 'name' => 'I1', 'ecat_name' => 'Included 1', 'description' => '', 'display_order' => 6],
            ['code' => 'I2', 'name' => 'I2', 'ecat_name' => 'Included 2', 'description' => '', 'display_order' => 7],
            ['code' => 'I1-I2', 'name' => 'I1-I2', 'ecat_name' => 'Included 1/2', 'description' => '', 'display_order' => 8],
            ['code' => 'VVS', 'name' => 'VVS', 'ecat_name' => 'Very Very Slightly Included', 'description' => '', 'display_order' => 9],
            ['code' => 'VS', 'name' => 'VS', 'ecat_name' => 'Very Slight Included', 'description' => '', 'display_order' => 12],
            ['code' => 'SI', 'name' => 'SI', 'ecat_name' => 'Slightly Included', 'description' => '', 'display_order' => 13],
            ['code' => 'VS-SI', 'name' => 'VS-SI', 'ecat_name' => 'Very Slightly Included-1', 'description' => '', 'display_order' => 11],
            ['code' => 'VVS-VS', 'name' => 'VVS-VS', 'ecat_name' => 'Very Very Slightly Included-1', 'description' => '', 'display_order' => 10],
            ['code' => 'C-VVS', 'name' => 'C-VVS', 'ecat_name' => 'Lab Grown VVS', 'description' => '', 'display_order' => 14],
            ['code' => 'C-VVS-VS', 'name' => 'C-VVS-VS', 'ecat_name' => 'Lab Grown VVS-VS', 'description' => '', 'display_order' => 15],
            ['code' => 'C-VS', 'name' => 'C-VS', 'ecat_name' => 'Lab Grown VS', 'description' => '', 'display_order' => 16],
            ['code' => 'C-VS-SI', 'name' => 'C-VS-SI', 'ecat_name' => 'Lab Grown VS_SI', 'description' => '', 'display_order' => 17],
            ['code' => 'PD', 'name' => 'PD', 'ecat_name' => 'Party Diamond', 'description' => '', 'display_order' => 18],
            ['code' => 'C-PD', 'name' => 'C-PD', 'ecat_name' => 'Lab Grown Party Diamond', 'description' => '', 'display_order' => 19],
            ['code' => 'SI2', 'name' => 'SI2', 'ecat_name' => 'Slightly Inclusion', 'description' => '', 'display_order' => 20],
            ['code' => 'S-SI', 'name' => 'S-SI', 'ecat_name' => 'S-SI', 'description' => '', 'display_order' => 21],
            ['code' => 'MOZ', 'name' => 'MOZ', 'ecat_name' => 'Moissanite', 'description' => '', 'display_order' => 22],
            ['code' => 'VVS1', 'name' => 'VVS1', 'ecat_name' => 'Very Very Slightly Included(1)', 'description' => '', 'display_order' => 23],
            ['code' => 'C-SI', 'name' => 'C-SI', 'ecat_name' => 'Lab Grown SI', 'description' => '', 'display_order' => 24],
        ];

        foreach ($clarities as $clarity) {
            DiamondClarity::updateOrCreate(
                ['name' => $clarity['name']],
                [
                    'code' => $clarity['code'] ?: null,
                    'ecat_name' => $clarity['ecat_name'] ?: null,
                    'description' => $clarity['description'] ?: null,
                    'display_order' => $clarity['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($clarities) . ' diamond clarities.');
    }

    protected function seedDiamondColors(): void
    {
        $this->command->info('Seeding diamond colors...');

        $colors = [
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

        foreach ($colors as $color) {
            DiamondColor::updateOrCreate(
                ['name' => $color['name']],
                [
                    'code' => $color['code'] ?: null,
                    'ecat_name' => null,
                    'description' => $color['description'] ?: null,
                    'display_order' => $color['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($colors) . ' diamond colors.');
    }

    protected function seedDiamondShapes(): void
    {
        $this->command->info('Seeding diamond shapes...');

        $shapes = [
            ['code' => 'UnGraded', 'name' => 'UnGraded', 'ecat_name' => '', 'display_order' => 0],
            ['code' => 'RND', 'name' => 'RND', 'ecat_name' => 'Round', 'display_order' => 1],
            ['code' => 'RND-S', 'name' => 'RND-S', 'ecat_name' => 'Round Single Cut', 'display_order' => 2],
            ['code' => 'BUG', 'name' => 'BUG', 'ecat_name' => 'Baguette', 'display_order' => 3],
            ['code' => 'HRT', 'name' => 'HRT', 'ecat_name' => 'Heart', 'display_order' => 4],
            ['code' => 'MRQ', 'name' => 'MRQ', 'ecat_name' => 'Marquise', 'display_order' => 5],
            ['code' => 'OVL', 'name' => 'OVL', 'ecat_name' => 'Ovel', 'display_order' => 6],
            ['code' => 'PRI', 'name' => 'PRI', 'ecat_name' => 'Princess', 'display_order' => 7],
            ['code' => 'EMR', 'name' => 'EMR', 'ecat_name' => 'Emerald', 'display_order' => 8],
            ['code' => 'PRS', 'name' => 'PRS', 'ecat_name' => 'Pears', 'display_order' => 9],
            ['code' => 'CSN', 'name' => 'CSN', 'ecat_name' => 'Cushion', 'display_order' => 10],
            ['code' => 'ASH', 'name' => 'ASH', 'ecat_name' => 'Asscher', 'display_order' => 11],
            ['code' => 'CUS', 'name' => 'CUS', 'ecat_name' => 'Customize', 'display_order' => 12],
            ['code' => 'RSC', 'name' => 'RSC', 'ecat_name' => 'Rose Cut', 'display_order' => 13],
        ];

        foreach ($shapes as $shape) {
            DiamondShape::updateOrCreate(
                ['name' => $shape['name']],
                [
                    'code' => $shape['code'] ?: null,
                    'ecat_name' => $shape['ecat_name'] ?: null,
                    'description' => null,
                    'display_order' => $shape['display_order'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Imported ' . count($shapes) . ' diamond shapes.');
    }

    protected function seedDiamondShapeSizes(): void
    {
        $this->command->info('Seeding diamond shape sizes...');

        // Get all shapes indexed by name for lookup
        $shapes = DiamondShape::all()->keyBy('name');

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
                    'description' => $sizeData['description'] ?: null,
                    'display_order' => $sizeData['display_order'],
                    'ctw' => $sizeData['ctw'],
                ]
            );
            $count++;
        }

        $this->command->info("Imported {$count} diamond shape sizes. Skipped {$skipped} due to missing shapes.");
    }
}
