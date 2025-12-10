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
        Schema::create('diamond_colors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('diamond_type_id')->constrained('diamond_types')->restrictOnDelete();
            $table->string('code')->comment('diamondcolorcode');
            $table->string('name')->comment('diamondcolorname');
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->index('code');
            $table->index('display_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diamond_colors');
    }
};
