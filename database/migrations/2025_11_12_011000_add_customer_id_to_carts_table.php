<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('carts', 'customer_id')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->foreignId('customer_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('customers')
                    ->cascadeOnDelete();
            });

            if (Schema::hasColumn('carts', 'user_id')) {
                DB::table('carts')->update([
                    'customer_id' => DB::raw('user_id'),
                ]);

                Schema::table('carts', function (Blueprint $table) {
                    $table->dropForeign('carts_user_id_foreign');
                });

                Schema::table('carts', function (Blueprint $table) {
                    $table->dropColumn('user_id');
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('carts', 'customer_id')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->dropConstrainedForeignId('customer_id');
            });
        }

        if (! Schema::hasColumn('carts', 'user_id')) {
            Schema::table('carts', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('customers')->cascadeOnDelete();
            });
        }
    }
};

