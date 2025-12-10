<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update any existing NULL values
        // Set default code for brands without code (using name as fallback)
        DB::table('brands')
            ->whereNull('code')
            ->update(['code' => DB::raw("UPPER(SUBSTRING(name, 1, 3))")]);

        // Set default display_order for brands without it
        DB::table('brands')
            ->whereNull('display_order')
            ->update(['display_order' => 0]);

        // Now make the columns NOT NULL
        Schema::table('brands', function (Blueprint $table) {
            $table->string('code')->nullable(false)->change();
            $table->integer('display_order')->nullable(false)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->string('code')->nullable()->change();
            $table->integer('display_order')->nullable()->default(0)->change();
        });
    }
};
