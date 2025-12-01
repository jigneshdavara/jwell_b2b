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
        Schema::table('product_variant_diamonds', function (Blueprint $table) {
            // Add diamonds_count column if it doesn't exist
            if (!Schema::hasColumn('product_variant_diamonds', 'diamonds_count')) {
                $table->integer('diamonds_count')->nullable()->after('stone_count');
            }
        });

        // Migrate existing stone_count data to diamonds_count if stone_count exists
        if (Schema::hasColumn('product_variant_diamonds', 'stone_count')) {
            DB::statement('UPDATE product_variant_diamonds SET diamonds_count = stone_count WHERE diamonds_count IS NULL AND stone_count IS NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variant_diamonds', function (Blueprint $table) {
            if (Schema::hasColumn('product_variant_diamonds', 'diamonds_count')) {
                $table->dropColumn('diamonds_count');
            }
        });
    }
};
