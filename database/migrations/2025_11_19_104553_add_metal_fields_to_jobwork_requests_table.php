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
        Schema::table('jobwork_requests', function (Blueprint $table) {
            $table->foreignId('metal_id')->nullable()->after('purity')->constrained('metals')->nullOnDelete();
            $table->foreignId('metal_purity_id')->nullable()->after('metal_id')->constrained('metal_purities')->nullOnDelete();
            $table->foreignId('metal_tone_id')->nullable()->after('metal_purity_id')->constrained('metal_tones')->nullOnDelete();

            $table->index('metal_id');
            $table->index('metal_purity_id');
            $table->index('metal_tone_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jobwork_requests', function (Blueprint $table) {
            $table->dropForeign(['metal_id']);
            $table->dropForeign(['metal_purity_id']);
            $table->dropForeign(['metal_tone_id']);

            $table->dropIndex(['metal_id']);
            $table->dropIndex(['metal_purity_id']);
            $table->dropIndex(['metal_tone_id']);

            $table->dropColumn(['metal_id', 'metal_purity_id', 'metal_tone_id']);
        });
    }
};
