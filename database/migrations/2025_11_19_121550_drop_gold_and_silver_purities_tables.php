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
        Schema::dropIfExists('gold_purities');
        Schema::dropIfExists('silver_purities');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration drops tables, so we cannot fully restore them
        // If you need to restore, you would need to recreate the tables manually
        // or restore from a backup
    }
};
