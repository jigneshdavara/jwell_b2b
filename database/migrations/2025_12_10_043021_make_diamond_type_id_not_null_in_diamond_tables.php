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
        // Get the Natural Diamond type ID
        $naturalTypeId = DB::table('diamond_types')->where('code', 'NAT')->value('id');

        // Only update NULL values if:
        // 1. There are existing records with NULL values
        // 2. The Natural Diamond type exists (seeders may not have run yet in fresh migrations)
        if ($naturalTypeId) {
            // Check and update only if there are NULL values
            if (DB::table('diamond_colors')->whereNull('diamond_type_id')->exists()) {
                DB::table('diamond_colors')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
            }
            if (DB::table('diamond_clarities')->whereNull('diamond_type_id')->exists()) {
                DB::table('diamond_clarities')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
            }
            if (DB::table('diamond_shapes')->whereNull('diamond_type_id')->exists()) {
                DB::table('diamond_shapes')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
            }
            if (DB::table('diamond_shape_sizes')->whereNull('diamond_type_id')->exists()) {
                DB::table('diamond_shape_sizes')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
            }
            if (DB::table('diamonds')->whereNull('diamond_type_id')->exists()) {
                DB::table('diamonds')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
            }
        }
        // Note: If diamond_types table is empty (fresh migration), we skip the update.
        // The NOT NULL constraint will be applied, and seeders will populate data with proper types.

        // Make columns NOT NULL
        // Note: This will work fine even if tables are empty (fresh migration)
        Schema::table('diamond_colors', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });

        Schema::table('diamond_clarities', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });

        Schema::table('diamond_shapes', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });

        Schema::table('diamond_shape_sizes', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });

        Schema::table('diamonds', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diamond_colors', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable()->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('set null');
        });

        Schema::table('diamond_clarities', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable()->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('set null');
        });

        Schema::table('diamond_shapes', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable()->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('set null');
        });

        Schema::table('diamond_shape_sizes', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable()->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('set null');
        });

        Schema::table('diamonds', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable()->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('set null');
        });
    }
};
