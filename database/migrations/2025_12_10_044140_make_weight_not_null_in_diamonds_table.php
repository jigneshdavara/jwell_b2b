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
        // Update existing NULL values to 0
        DB::table('diamonds')->whereNull('weight')->update(['weight' => 0.000]);

        // Make column NOT NULL
        Schema::table('diamonds', function (Blueprint $table) {
            $table->decimal('weight', 10, 3)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diamonds', function (Blueprint $table) {
            $table->decimal('weight', 10, 3)->nullable()->change();
        });
    }
};
