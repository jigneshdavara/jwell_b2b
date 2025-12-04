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
        // Drop foreign keys from products table
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'brand_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropForeign(['brand_id']);
                $table->dropColumn('brand_id');
            });
        }

        // Drop foreign keys from making_charge_discounts table
        if (Schema::hasTable('making_charge_discounts') && Schema::hasColumn('making_charge_discounts', 'brand_id')) {
            Schema::table('making_charge_discounts', function (Blueprint $table) {
                $table->dropForeign(['brand_id']);
                $table->dropColumn('brand_id');
            });
        }

        // Drop brands table
        Schema::dropIfExists('brands');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('cover_image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('brand_id')->nullable()->constrained()->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('making_charge_discounts')) {
            Schema::table('making_charge_discounts', function (Blueprint $table) {
                $table->foreignId('brand_id')->nullable()->constrained()->cascadeOnDelete();
            });
        }
    }
};
