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
        Schema::table('making_charge_discounts', function (Blueprint $table) {
            $table->json('customer_types')->nullable()->after('customer_group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('making_charge_discounts', function (Blueprint $table) {
            $table->dropColumn('customer_types');
        });
    }
};

