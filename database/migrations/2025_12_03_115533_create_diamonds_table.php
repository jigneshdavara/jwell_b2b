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
        Schema::create('diamonds', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('diamond_type_id')->constrained('diamond_types')->restrictOnDelete();
            $table->foreignId('diamond_clarity_id')->constrained('diamond_clarities')->restrictOnDelete();
            $table->foreignId('diamond_color_id')->constrained('diamond_colors')->restrictOnDelete();
            $table->foreignId('diamond_shape_id')->constrained('diamond_shapes')->restrictOnDelete();
            $table->foreignId('diamond_shape_size_id')->constrained('diamond_shape_sizes')->restrictOnDelete();
            $table->decimal('weight', 10, 3)->default(0);
            $table->decimal('price', 12, 2)->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->index(['diamond_clarity_id', 'diamond_color_id', 'diamond_shape_id']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diamonds');
    }
};
