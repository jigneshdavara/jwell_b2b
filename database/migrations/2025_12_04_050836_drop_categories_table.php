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
        // Drop foreign key constraints first
        if (Schema::hasTable('products')) {
            try {
                Schema::table('products', function (Blueprint $table) {
                    if (Schema::hasColumn('products', 'category_id')) {
                        $table->dropForeign(['category_id']);
                    }
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
        }

        if (Schema::hasTable('making_charge_discounts')) {
            try {
                Schema::table('making_charge_discounts', function (Blueprint $table) {
                    if (Schema::hasColumn('making_charge_discounts', 'category_id')) {
                        $table->dropForeign(['category_id']);
                    }
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
        }

        // Drop the categories table
        Schema::dropIfExists('categories');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate categories table
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();
        });

        // Re-add foreign keys if tables exist
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'category_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('making_charge_discounts') && Schema::hasColumn('making_charge_discounts', 'category_id')) {
            Schema::table('making_charge_discounts', function (Blueprint $table) {
                $table->foreign('category_id')->references('id')->on('categories')->cascadeOnDelete();
            });
        }
    }
};
