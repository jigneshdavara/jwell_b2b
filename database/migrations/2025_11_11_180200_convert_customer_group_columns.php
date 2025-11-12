<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (! Schema::hasColumn('customers', 'customer_group_id')) {
                $table->foreignId('customer_group_id')
                    ->nullable()
                    ->after('type')
                    ->constrained('customer_groups')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasColumn('customers', 'user_group_id')) {
            DB::table('customers')
                ->whereNull('customer_group_id')
                ->whereNotNull('user_group_id')
                ->update(['customer_group_id' => DB::raw('user_group_id')]);

            Schema::table('customers', function (Blueprint $table) {
                $table->dropConstrainedForeignId('user_group_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (! Schema::hasColumn('customers', 'user_group_id')) {
                $table->foreignId('user_group_id')
                    ->nullable()
                    ->after('type')
                    ->constrained('user_groups')
                    ->nullOnDelete();
            }
        });

        if (Schema::hasColumn('customers', 'customer_group_id')) {
            DB::table('customers')
                ->whereNull('user_group_id')
                ->whereNotNull('customer_group_id')
                ->update(['user_group_id' => DB::raw('customer_group_id')]);

            Schema::table('customers', function (Blueprint $table) {
                $table->dropConstrainedForeignId('customer_group_id');
            });
        }
    }
};

