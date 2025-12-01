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
            if (Schema::hasColumn('products', 'gold_purity_ids')) {
                $table->dropColumn('gold_purity_ids');
            }
            if (Schema::hasColumn('products', 'silver_purity_ids')) {
                $table->dropColumn('silver_purity_ids');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'gold_purity_ids')) {
                $table->jsonb('gold_purity_ids')->nullable();
            }
            if (!Schema::hasColumn('products', 'silver_purity_ids')) {
                $table->jsonb('silver_purity_ids')->nullable();
            }
        });
    }
};
