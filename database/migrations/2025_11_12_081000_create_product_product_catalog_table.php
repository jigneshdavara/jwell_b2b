<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_product_catalog', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_catalog_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['product_id', 'product_catalog_id'], 'product_catalog_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_product_catalog');
    }
};

