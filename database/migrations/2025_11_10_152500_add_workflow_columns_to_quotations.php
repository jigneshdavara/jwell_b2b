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
        Schema::table('quotations', function (Blueprint $table) {
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete()->after('notes');
            $table->timestamp('approved_at')->nullable()->after('order_id');
            $table->string('jobwork_status')->nullable()->after('approved_at');
            $table->text('admin_notes')->nullable()->after('jobwork_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn(['admin_notes', 'jobwork_status', 'approved_at']);
            $table->dropConstrainedForeignId('order_id');
        });
    }
};

