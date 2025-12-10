<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\DiamondShape;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('diamond_shapes', function (Blueprint $table) {
            // Update existing null values before making columns non-nullable
            DiamondShape::whereNull('code')->get()->each(function (DiamondShape $shape) {
                $shape->update(['code' => strtoupper(substr($shape->name, 0, 3)) . $shape->id]);
            });
            DiamondShape::whereNull('display_order')->update(['display_order' => 0]);

            $table->string('code')->nullable(false)->change();
            $table->integer('display_order')->nullable(false)->change();
            $table->unique(['diamond_type_id', 'code']); // Added composite unique constraint for code
            $table->unique(['diamond_type_id', 'name']); // Added composite unique constraint for name
            $table->dropColumn('ecat_name'); // Drop ecat_name column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diamond_shapes', function (Blueprint $table) {
            $table->string('code')->nullable()->change();
            $table->integer('display_order')->nullable()->change();
            $table->dropUnique(['diamond_type_id', 'code']); // Dropped composite unique constraint for code
            $table->dropUnique(['diamond_type_id', 'name']); // Dropped composite unique constraint for name
            $table->string('ecat_name')->nullable()->after('name'); // Restore ecat_name column
        });
    }
};
