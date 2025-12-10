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
        // Create category_styles pivot table
        Schema::create('category_styles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->foreignId('style_id')->constrained('styles')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['category_id', 'style_id']);
            $table->index('category_id');
            $table->index('style_id');
        });

        // Create category_sizes pivot table
        Schema::create('category_sizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->foreignId('size_id')->constrained('sizes')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['category_id', 'size_id']);
            $table->index('category_id');
            $table->index('size_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_sizes');
        Schema::dropIfExists('category_styles');
    }
};
