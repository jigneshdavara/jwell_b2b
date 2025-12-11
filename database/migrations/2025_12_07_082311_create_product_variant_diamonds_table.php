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
        Schema::create('product_variant_diamonds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('diamond_id')->nullable()->constrained('diamonds')->nullOnDelete();
            $table->integer('diamonds_count')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->integer('display_order')->default(0);
            $table->timestampsTz();

            $table->index('product_variant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variant_diamonds');
    }
};
