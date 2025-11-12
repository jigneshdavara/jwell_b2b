<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_catalogs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('product_catalog_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_catalog_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['product_catalog_id', 'product_id'], 'product_catalog_product_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_catalog_product');
        Schema::dropIfExists('product_catalogs');
    }
};

