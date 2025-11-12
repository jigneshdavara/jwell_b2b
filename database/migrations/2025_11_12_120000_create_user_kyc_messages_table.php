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
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('sender_type', ['customer', 'admin']);
            $table->text('message');
            $table->timestamps();
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->boolean('kyc_comments_enabled')->default(true)->after('kyc_notes');
            $table->boolean('is_active')->default(true)->after('kyc_comments_enabled');
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

