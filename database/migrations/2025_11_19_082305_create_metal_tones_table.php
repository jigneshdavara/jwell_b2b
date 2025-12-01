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
        Schema::create('metal_tones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('metal_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g. "Yellow Gold", "White Gold", "Rose Gold"
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('position')->default(0);
            $table->timestampsTz();

            $table->unique(['metal_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metal_tones');
    }
};
