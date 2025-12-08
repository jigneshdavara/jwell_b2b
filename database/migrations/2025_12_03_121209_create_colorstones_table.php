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
        Schema::create('colorstones', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('colorstone_color_id')->nullable()->constrained('colorstone_colors')->nullOnDelete();
            $table->foreignId('colorstone_quality_id')->nullable()->constrained('colorstone_qualities')->nullOnDelete();
            $table->foreignId('colorstone_shape_id')->nullable()->constrained('colorstone_shapes')->nullOnDelete();
            $table->foreignId('colorstone_shape_size_id')->nullable()->constrained('colorstone_shape_sizes')->nullOnDelete();
            $table->decimal('price', 12, 2)->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
            
            $table->index(['colorstone_color_id', 'colorstone_quality_id', 'colorstone_shape_id']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('colorstones');
    }
};
