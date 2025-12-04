<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop tables that have foreign keys to diamond tables first
        Schema::dropIfExists('diamond_shape_sizes');
        Schema::dropIfExists('product_variant_diamonds');

        // Drop the main diamond tables
        Schema::dropIfExists('diamond_shapes');
        Schema::dropIfExists('diamond_colors');
        Schema::dropIfExists('diamond_clarities');
        Schema::dropIfExists('diamond_cuts');
        Schema::dropIfExists('diamond_types');

        // Remove diamond-related columns from products table if they exist
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $columnsToDrop = [];

                if (Schema::hasColumn('products', 'uses_diamond')) {
                    $columnsToDrop[] = 'uses_diamond';
                }
                if (Schema::hasColumn('products', 'diamond_options')) {
                    $columnsToDrop[] = 'diamond_options';
                }
                if (Schema::hasColumn('products', 'diamond_type_ids')) {
                    $columnsToDrop[] = 'diamond_type_ids';
                }
                if (Schema::hasColumn('products', 'diamond_clarity_ids')) {
                    $columnsToDrop[] = 'diamond_clarity_ids';
                }
                if (Schema::hasColumn('products', 'diamond_color_ids')) {
                    $columnsToDrop[] = 'diamond_color_ids';
                }
                if (Schema::hasColumn('products', 'diamond_shape_ids')) {
                    $columnsToDrop[] = 'diamond_shape_ids';
                }
                if (Schema::hasColumn('products', 'diamond_cut_ids')) {
                    $columnsToDrop[] = 'diamond_cut_ids';
                }
                if (Schema::hasColumn('products', 'diamond_mixing_mode')) {
                    $columnsToDrop[] = 'diamond_mixing_mode';
                }
                if (Schema::hasColumn('products', 'diamond_behavior_mode')) {
                    $columnsToDrop[] = 'diamond_behavior_mode';
                }

                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }

        // Remove diamond-related columns from jobwork_requests table if they exist
        if (Schema::hasTable('jobwork_requests')) {
            Schema::table('jobwork_requests', function (Blueprint $table) {
                if (Schema::hasColumn('jobwork_requests', 'diamond_quality')) {
                    $table->dropColumn('diamond_quality');
                }
            });
        }

        // Remove diamond-related columns from product_variants table if they exist
        if (Schema::hasTable('product_variants')) {
            Schema::table('product_variants', function (Blueprint $table) {
                $columnsToDrop = [];

                if (Schema::hasColumn('product_variants', 'stone_quality')) {
                    $columnsToDrop[] = 'stone_quality';
                }
                // Add any other diamond-related columns in product_variants if they exist

                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration only drops tables, recreating them would require
        // running the original create migrations in order
    }
};
