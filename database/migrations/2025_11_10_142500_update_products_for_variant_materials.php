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
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'is_variant_product')) {
                $table->boolean('is_variant_product')->default(true);
            }

            if (! Schema::hasColumn('products', 'uses_gold')) {
                $table->boolean('uses_gold')->default(false);
            }

            if (! Schema::hasColumn('products', 'uses_silver')) {
                $table->boolean('uses_silver')->default(false);
            }

            if (! Schema::hasColumn('products', 'uses_diamond')) {
                $table->boolean('uses_diamond')->default(false);
            }

            if (! Schema::hasColumn('products', 'gold_purity_ids')) {
                $table->jsonb('gold_purity_ids')->nullable();
            }

            if (! Schema::hasColumn('products', 'silver_purity_ids')) {
                $table->jsonb('silver_purity_ids')->nullable();
            }

            if (! Schema::hasColumn('products', 'diamond_options')) {
                $table->jsonb('diamond_options')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            foreach ([
                'diamond_options',
                'silver_purity_ids',
                'gold_purity_ids',
                'uses_diamond',
                'uses_silver',
                'uses_gold',
                'is_variant_product',
            ] as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

