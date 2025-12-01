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
            $table->enum('making_charge_discount_type', ['percentage', 'fixed'])->nullable()->after('making_charge');
            $table->decimal('making_charge_discount_value', 10, 2)->nullable()->after('making_charge_discount_type');
            $table->jsonb('making_charge_discount_overrides')->nullable()->after('making_charge_discount_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'making_charge_discount_overrides',
                'making_charge_discount_value',
                'making_charge_discount_type',
            ]);
        });
    }
};
