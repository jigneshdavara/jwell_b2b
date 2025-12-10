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
        Schema::table('diamond_shape_sizes', function (Blueprint $table) {
            $table->foreignId('diamond_type_id')->after('id')->constrained('diamond_types')->restrictOnDelete();
            $table->index('diamond_type_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diamond_shape_sizes', function (Blueprint $table) {
            $table->dropForeign(['diamond_type_id']);
            $table->dropIndex(['diamond_type_id']);
            $table->dropColumn('diamond_type_id');
        });
    }
};
