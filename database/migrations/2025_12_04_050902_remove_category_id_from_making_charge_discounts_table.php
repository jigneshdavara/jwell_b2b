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
        if (Schema::hasTable('making_charge_discounts') && Schema::hasColumn('making_charge_discounts', 'category_id')) {
            Schema::table('making_charge_discounts', function (Blueprint $table) {
                $table->dropColumn('category_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('making_charge_discounts')) {
            Schema::table('making_charge_discounts', function (Blueprint $table) {
                $table->foreignId('category_id')->nullable()->after('brand_id')->constrained()->cascadeOnDelete();
            });
        }
    }
};
