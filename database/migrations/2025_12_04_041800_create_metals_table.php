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
        // Drop foreign key constraints from other tables first
        if (Schema::hasTable('product_variant_metals')) {
            try {
                Schema::table('product_variant_metals', function (Blueprint $table) {
                    $table->dropForeign(['metal_id']);
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
            try {
                Schema::table('product_variant_metals', function (Blueprint $table) {
                    $table->dropForeign(['metal_purity_id']);
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
            try {
                Schema::table('product_variant_metals', function (Blueprint $table) {
                    $table->dropForeign(['metal_tone_id']);
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
        }

        if (Schema::hasTable('jobwork_requests')) {
            try {
                Schema::table('jobwork_requests', function (Blueprint $table) {
                    if (Schema::hasColumn('jobwork_requests', 'metal_id')) {
                        $table->dropForeign(['metal_id']);
                    }
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
            try {
                Schema::table('jobwork_requests', function (Blueprint $table) {
                    if (Schema::hasColumn('jobwork_requests', 'metal_purity_id')) {
                        $table->dropForeign(['metal_purity_id']);
                    }
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
            try {
                Schema::table('jobwork_requests', function (Blueprint $table) {
                    if (Schema::hasColumn('jobwork_requests', 'metal_tone_id')) {
                        $table->dropForeign(['metal_tone_id']);
                    }
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
        }

        // Drop dependent tables first
        if (Schema::hasTable('metal_purities')) {
            try {
                Schema::table('metal_purities', function (Blueprint $table) {
                    $table->dropForeign(['metal_id']);
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
        }
        Schema::dropIfExists('metal_purities');

        if (Schema::hasTable('metal_tones')) {
            try {
                Schema::table('metal_tones', function (Blueprint $table) {
                    $table->dropForeign(['metal_id']);
                });
            } catch (\Exception $e) {
                // Foreign key might not exist
            }
        }
        Schema::dropIfExists('metal_tones');

        Schema::dropIfExists('metals');

        Schema::create('metals', function (Blueprint $table) {
            $table->id();
            $table->string('code')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->index('code');
            $table->index('display_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metals');
    }
};
