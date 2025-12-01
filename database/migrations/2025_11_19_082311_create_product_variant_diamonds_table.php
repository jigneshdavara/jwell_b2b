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
        Schema::create('product_variant_diamonds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('diamond_type_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('diamond_shape_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('diamond_color_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('diamond_clarity_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('diamond_cut_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('stone_count')->nullable();
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
        Schema::dropIfExists('product_variant_diamonds');
    }
};
