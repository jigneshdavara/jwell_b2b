<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('gold_weight', 10, 3)->nullable()->after('net_weight');
            $table->decimal('silver_weight', 10, 3)->nullable()->after('gold_weight');
            $table->decimal('other_material_weight', 10, 3)->nullable()->after('silver_weight');
            $table->decimal('total_weight', 10, 3)->nullable()->after('other_material_weight');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['gold_weight', 'silver_weight', 'other_material_weight', 'total_weight']);
        });
    }
};

