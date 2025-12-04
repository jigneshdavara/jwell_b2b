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
        // Drop pivot tables first (they have foreign keys)
        Schema::dropIfExists('product_catalog_product');
        Schema::dropIfExists('product_product_catalog');

        // Drop main table
        Schema::dropIfExists('product_catalogs');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration doesn't recreate the tables as we don't have the original schema
        // If rollback is needed, the original migrations should be used
    }
};
