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

        if (!$naturalTypeId) {
            throw new \Exception('Natural Diamond type not found. Please seed diamond types first.');
        }

        // Update existing NULL values to Natural Diamond type
        DB::table('diamond_colors')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
        DB::table('diamond_clarities')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
        DB::table('diamond_shapes')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
        DB::table('diamond_shape_sizes')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);
        DB::table('diamonds')->whereNull('diamond_type_id')->update(['diamond_type_id' => $naturalTypeId]);

        // Make columns NOT NULL
        Schema::table('diamond_colors', function (Blueprint $table) use ($naturalTypeId) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });

        Schema::table('diamond_clarities', function (Blueprint $table) use ($naturalTypeId) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });

        Schema::table('diamond_shapes', function (Blueprint $table) use ($naturalTypeId) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });

        Schema::table('diamond_shape_sizes', function (Blueprint $table) use ($naturalTypeId) {
            $table->dropForeign(['diamond_type_id']);
            $table->foreignId('diamond_type_id')->nullable(false)->change();
            $table->foreign('diamond_type_id')->references('id')->on('diamond_types')->onDelete('restrict');
        });

        Schema::table('diamonds', function (Blueprint $table) use ($naturalTypeId) {
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
