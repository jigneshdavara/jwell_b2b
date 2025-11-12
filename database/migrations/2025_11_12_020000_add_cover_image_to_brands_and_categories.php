<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            if (! Schema::hasColumn('brands', 'cover_image_path')) {
                $table->string('cover_image_path')->nullable()->after('description');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (! Schema::hasColumn('categories', 'cover_image_path')) {
                $table->string('cover_image_path')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            if (Schema::hasColumn('brands', 'cover_image_path')) {
                $table->dropColumn('cover_image_path');
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'cover_image_path')) {
                $table->dropColumn('cover_image_path');
            }
        });
    }
};

