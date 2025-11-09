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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('type')->default('retailer')->after('phone');
            $table->string('kyc_status')->default('pending')->after('type');
            $table->string('preferred_language')->default('en')->after('kyc_status');
            $table->decimal('credit_limit', 12, 2)->default(0)->after('preferred_language');
            $table->text('kyc_notes')->nullable()->after('credit_limit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'type',
                'kyc_status',
                'preferred_language',
                'credit_limit',
                'kyc_notes',
            ]);
        });
    }
};
