<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->jsonb('metal_mix_mode')
                ->default(DB::raw("'{}'::jsonb")) // explicit jsonb default for Postgres
                ->nullable(false)
                ->after('mixed_metal_purities_per_tone');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('metal_mix_mode');
        });
    }
};
