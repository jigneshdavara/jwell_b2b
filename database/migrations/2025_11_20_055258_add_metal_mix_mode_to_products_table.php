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
        Schema::table('products', function (Blueprint $table) {
            $table->jsonb('metal_mix_mode')->default('{}')->after('mixed_metal_purities_per_tone');
        });

        // Update existing rows to have empty object instead of null
        DB::table('products')->whereNull('metal_mix_mode')->update(['metal_mix_mode' => '{}']);

        // Make the column NOT NULL after updating existing data
        Schema::table('products', function (Blueprint $table) {
            $table->jsonb('metal_mix_mode')->default('{}')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('metal_mix_mode');
        });
    }
};
