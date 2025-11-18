<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_kyc_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('customers')->cascadeOnDelete();
            // admin_id references admin users table
            $table->foreignId('admin_id')->nullable();
            $table->enum('sender_type', ['customer', 'admin']);
            $table->text('message');
            $table->timestampsTz();
        });

        // Add foreign key constraint if users table exists (for admin users)
        if (Schema::hasTable('users')) {
            Schema::table('user_kyc_messages', function (Blueprint $table) {
                $table->foreign('admin_id')->references('id')->on('users')->nullOnDelete();
            });
        }

        Schema::table('customers', function (Blueprint $table) {
            // PostgreSQL doesn't support 'after()', columns will be added at the end
            if (! Schema::hasColumn('customers', 'kyc_comments_enabled')) {
                $table->boolean('kyc_comments_enabled')->default(true);
            }
            if (! Schema::hasColumn('customers', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['kyc_comments_enabled', 'is_active']);
        });

        Schema::dropIfExists('user_kyc_messages');
    }
};
