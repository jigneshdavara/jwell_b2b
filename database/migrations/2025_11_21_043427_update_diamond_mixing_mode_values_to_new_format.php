<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update old mode values to new format
        DB::table('products')
            ->where('diamond_mixing_mode', 'shared_matrix')
            ->update(['diamond_mixing_mode' => 'shared']);

        DB::table('products')
            ->where('diamond_mixing_mode', 'per_variant')
            ->update(['diamond_mixing_mode' => 'as_variant']);

        // Update default for any null values
        DB::table('products')
            ->whereNull('diamond_mixing_mode')
            ->update(['diamond_mixing_mode' => 'shared']);
    }

    public function down(): void
    {
        // Revert to old format
        DB::table('products')
            ->where('diamond_mixing_mode', 'shared')
            ->update(['diamond_mixing_mode' => 'shared_matrix']);

        DB::table('products')
            ->where('diamond_mixing_mode', 'as_variant')
            ->update(['diamond_mixing_mode' => 'per_variant']);
    }
};
