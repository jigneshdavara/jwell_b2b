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
        Schema::create('diamond_shape_sizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('diamond_type_id')->constrained('diamond_types')->restrictOnDelete();
            $table->foreignId('diamond_shape_id')->constrained('diamond_shapes')->cascadeOnDelete();
            $table->string('size')->comment('diamondshapesize');
            $table->string('secondary_size')->nullable()->comment('diamondsecondarysize');
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);
            $table->decimal('ctw', 10, 3)->default(0)->comment('Carat Total Weight');
            $table->timestampsTz();

            $table->index(['diamond_shape_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diamond_shape_sizes');
    }
};
