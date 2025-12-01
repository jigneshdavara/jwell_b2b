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
            if (! Schema::hasColumn('products', 'metal_ids')) {
                $table->jsonb('metal_ids')->nullable()->after('uses_diamond');
            }

            if (! Schema::hasColumn('products', 'metal_purity_ids')) {
                $table->jsonb('metal_purity_ids')->nullable()->after('metal_ids');
            }

            if (! Schema::hasColumn('products', 'metal_tone_ids')) {
                $table->jsonb('metal_tone_ids')->nullable()->after('metal_purity_ids');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            foreach (['metal_tone_ids', 'metal_purity_ids', 'metal_ids'] as $column) {
                if (Schema::hasColumn('products', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
