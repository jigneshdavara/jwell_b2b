<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->jsonb('diamond_type_ids')->nullable()->after('diamond_options');
            $table->jsonb('diamond_clarity_ids')->nullable()->after('diamond_type_ids');
            $table->jsonb('diamond_color_ids')->nullable()->after('diamond_clarity_ids');
            $table->jsonb('diamond_shape_ids')->nullable()->after('diamond_color_ids');
            $table->jsonb('diamond_cut_ids')->nullable()->after('diamond_shape_ids');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'diamond_type_ids',
                'diamond_clarity_ids',
                'diamond_color_ids',
                'diamond_shape_ids',
                'diamond_cut_ids',
            ]);
        });
    }
};
