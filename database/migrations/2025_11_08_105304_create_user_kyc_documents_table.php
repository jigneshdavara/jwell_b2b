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
        Schema::create('user_kyc_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('customers')->cascadeOnDelete();
            $table->string('type');
            $table->string('file_path');
            $table->string('status')->default('pending');
            $table->string('remarks')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_kyc_documents');
    }
};
