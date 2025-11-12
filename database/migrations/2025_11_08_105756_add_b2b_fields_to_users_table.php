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
        Schema::table('customers', function (Blueprint $table) {
            if (! Schema::hasColumn('customers', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (! Schema::hasColumn('customers', 'type')) {
                $table->string('type')->default('retailer')->after('phone');
            }
            if (! Schema::hasColumn('customers', 'kyc_status')) {
                $table->string('kyc_status')->default('pending')->after('type');
            }
            if (! Schema::hasColumn('customers', 'preferred_language')) {
                $table->string('preferred_language')->default('en')->after('kyc_status');
            }
            if (! Schema::hasColumn('customers', 'credit_limit')) {
                $table->decimal('credit_limit', 12, 2)->default(0)->after('preferred_language');
            }
            if (! Schema::hasColumn('customers', 'kyc_notes')) {
                $table->text('kyc_notes')->nullable()->after('credit_limit');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $columns = [
                'phone',
                'type',
                'kyc_status',
                'preferred_language',
                'credit_limit',
                'kyc_notes',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('customers', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
