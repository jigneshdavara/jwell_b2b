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
        if (Schema::hasTable('users')) {
            $hasCustomerColumns = Schema::hasColumn('users', 'phone')
                || Schema::hasColumn('users', 'kyc_status')
                || Schema::hasColumn('users', 'preferred_language');

            if ($hasCustomerColumns) {
                if (! Schema::hasTable('customers')) {
                    Schema::rename('users', 'customers');
                } else {
                    Schema::drop('users');
                }
            }
        }

        if (Schema::hasTable('users')) {
            return;
        }

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('type')->default('admin');
            $table->foreignId('user_group_id')->nullable()->constrained('user_groups')->nullOnDelete();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

