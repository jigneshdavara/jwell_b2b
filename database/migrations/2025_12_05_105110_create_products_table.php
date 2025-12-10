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
            $table->jsonb('subcategory_ids')->nullable();
            $table->string('collection')->nullable();
            $table->string('producttype')->nullable();
            $table->string('gender')->nullable();
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->decimal('making_charge_amount', 12, 2)->nullable();
            $table->decimal('making_charge_percentage', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
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
