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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('brand_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->decimal('making_charge', 12, 2)->default(0);
            $table->boolean('is_jobwork_allowed')->default(false);
            $table->string('visibility')->nullable();
            $table->string('style')->nullable();
            $table->jsonb('standard_pricing')->nullable();
            $table->boolean('is_active')->default(true);
            $table->jsonb('metadata')->nullable();
            $table->boolean('is_variant_product')->default(true);
            $table->enum('making_charge_discount_type', ['percentage', 'fixed'])->nullable();
            $table->decimal('making_charge_discount_value', 10, 2)->nullable();
            $table->jsonb('making_charge_discount_overrides')->nullable();
            $table->boolean('mixed_metal_tones_per_purity')->default(false);
            $table->boolean('mixed_metal_purities_per_tone')->default(false);
            $table->jsonb('metal_mix_mode')->default('{}')->nullable(false);
            $table->string('diamond_behavior_mode')->default('manual');
            $table->string('diamond_mixing_mode')->default('shared');
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
