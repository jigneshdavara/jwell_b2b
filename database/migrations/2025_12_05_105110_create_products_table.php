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
            $table->string('name');
            $table->string('titleline')->nullable();
            $table->foreignId('brand_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('collection')->nullable();
            $table->string('producttype')->nullable();
            $table->string('gender')->nullable();
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->decimal('making_charge', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->enum('making_charge_discount_type', ['percentage', 'fixed'])->nullable();
            $table->decimal('making_charge_discount_value', 10, 2)->nullable();
            $table->jsonb('making_charge_discount_overrides')->nullable();
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
