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
            $table->foreignId('diamond_clarity_id')->nullable()->constrained('diamond_clarities')->nullOnDelete();
            $table->foreignId('diamond_color_id')->nullable()->constrained('diamond_colors')->nullOnDelete();
            $table->foreignId('diamond_shape_id')->nullable()->constrained('diamond_shapes')->nullOnDelete();
            $table->foreignId('diamond_shape_size_id')->nullable()->constrained('diamond_shape_sizes')->nullOnDelete();
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
