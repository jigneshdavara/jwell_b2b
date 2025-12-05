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
        Schema::create('product_variant_colorstones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('colorstone_shape_id')->nullable()->constrained('colorstone_shapes')->nullOnDelete();
            $table->foreignId('colorstone_color_id')->nullable()->constrained('colorstone_colors')->nullOnDelete();
            $table->foreignId('colorstone_quality_id')->nullable()->constrained('colorstone_qualities')->nullOnDelete();
            $table->integer('stones_count')->nullable();
            $table->decimal('total_carat', 10, 3)->nullable();
            $table->jsonb('metadata')->nullable();
            $table->integer('position')->default(0);
            $table->timestampsTz();

            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variant_colorstones');
    }
};
