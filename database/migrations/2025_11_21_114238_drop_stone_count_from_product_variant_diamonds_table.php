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
        Schema::table('product_variant_diamonds', function (Blueprint $table) {
            if (Schema::hasColumn('product_variant_diamonds', 'stone_count')) {
                $table->dropColumn('stone_count');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variant_diamonds', function (Blueprint $table) {
            // Restore the column with the same type it had originally
            $table->integer('stone_count')->nullable()->after('diamond_cut_id');
        });
    }
};
