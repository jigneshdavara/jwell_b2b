<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('product_variant_metals', function (Blueprint $table) {
            // Add metal_weight column if it doesn't exist
            if (!Schema::hasColumn('product_variant_metals', 'metal_weight')) {
                $table->decimal('metal_weight', 10, 3)->nullable()->after('weight_grams');
            }
        });

        // Migrate existing weight_grams data to metal_weight if weight_grams exists
        if (Schema::hasColumn('product_variant_metals', 'weight_grams')) {
            DB::statement('UPDATE product_variant_metals SET metal_weight = weight_grams WHERE metal_weight IS NULL AND weight_grams IS NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variant_metals', function (Blueprint $table) {
            if (Schema::hasColumn('product_variant_metals', 'metal_weight')) {
                $table->dropColumn('metal_weight');
            }
        });
    }
};
