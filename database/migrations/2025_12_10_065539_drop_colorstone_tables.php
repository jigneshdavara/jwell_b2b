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
        // Drop colorstone tables in reverse order of dependencies
        Schema::dropIfExists('product_variant_colorstones');
        Schema::dropIfExists('colorstones');
        Schema::dropIfExists('colorstone_shape_sizes');
        Schema::dropIfExists('colorstone_qualities');
        Schema::dropIfExists('colorstone_shapes');
        Schema::dropIfExists('colorstone_colors');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration drops tables, so down() would need to recreate them
        // For now, we'll leave it empty as we're removing colorstone functionality
    }
};
