<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('carts', 'user_id') || ! Schema::hasColumn('carts', 'customer_id')) {
            return;
        }

        Schema::table('carts', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->after('id')
                ->constrained('customers')
                ->cascadeOnDelete();
        });

        DB::table('carts')->update([
            'user_id' => DB::raw('customer_id'),
        ]);

        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('customer_id');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('carts', 'customer_id') || ! Schema::hasColumn('carts', 'user_id')) {
            return;
        }

        Schema::table('carts', function (Blueprint $table) {
            $table->foreignId('customer_id')
                ->nullable()
                ->after('id')
                ->constrained('customers')
                ->cascadeOnDelete();
        });

        DB::table('carts')->update([
            'customer_id' => DB::raw('user_id'),
        ]);

        Schema::table('carts', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
    }
};

