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
            $table->foreignId('converted_work_order_id')->nullable()->after('status')->constrained('work_orders')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jobwork_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('converted_work_order_id');
        });
    }
};
