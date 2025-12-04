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
        Schema::create('colorstone_shape_sizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('colorstone_shape_id')->constrained('colorstone_shapes')->cascadeOnDelete();
            $table->string('size')->nullable()->comment('colorstoneshape_size');
            $table->string('secondary_size')->nullable()->comment('fancystoneshapesecondarysize');
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);
            $table->decimal('ctw', 10, 3)->default(0)->comment('Carat Total Weight');
            $table->timestampsTz();
            
            $table->index(['colorstone_shape_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('colorstone_shape_sizes');
    }
};
