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
        Schema::create('product_variant_metals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('metal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('metal_purity_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('metal_tone_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('weight_grams', 10, 3)->nullable();
            $table->jsonb('metadata')->nullable();
            $table->integer('position')->default(0);
            $table->timestampsTz();

            $table->index(['product_variant_id', 'metal_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variant_metals');
    }
};
