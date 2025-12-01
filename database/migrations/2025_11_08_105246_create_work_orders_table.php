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
        Schema::create('work_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('jobwork_request_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('draft');
            // assigned_to will reference admin users table created later
            // Foreign key constraint will be added in a later migration
            $table->foreignId('assigned_to')->nullable();
            $table->timestampTz('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestampsTz();
        });

        // Add foreign key constraint if users table exists (for admin users)
        if (Schema::hasTable('users')) {
            Schema::table('work_orders', function (Blueprint $table) {
                $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_orders');
    }
};
