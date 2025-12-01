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
        // Add comments to mark columns as legacy - do not drop them yet for data migration
        // Only add comments on PostgreSQL (SQLite doesn't support COMMENT ON COLUMN)
        if (DB::getDriverName() === 'pgsql') {
            Schema::table('product_variants', function (Blueprint $table) {
                // These columns are now legacy and should not be used in new code
                // Data migration script will move data from these to new tables
                DB::statement("COMMENT ON COLUMN product_variants.metal_tone IS 'LEGACY: Use product_variant_metals table instead'");
                DB::statement("COMMENT ON COLUMN product_variants.stone_quality IS 'LEGACY: Use product_variant_diamonds table instead'");
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only remove comments on PostgreSQL (SQLite doesn't support COMMENT ON COLUMN)
        if (DB::getDriverName() === 'pgsql') {
            Schema::table('product_variants', function (Blueprint $table) {
                DB::statement("COMMENT ON COLUMN product_variants.metal_tone IS NULL");
                DB::statement("COMMENT ON COLUMN product_variants.stone_quality IS NULL");
            });
        }
    }
};
