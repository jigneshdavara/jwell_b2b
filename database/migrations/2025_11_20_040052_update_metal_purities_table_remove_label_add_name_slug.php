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
        Schema::table('metal_purities', function (Blueprint $table) {
            // Drop the old unique constraint on metal_id + label
            $table->dropUnique(['metal_id', 'label']);
        });

        // Add name and slug columns as nullable first
        Schema::table('metal_purities', function (Blueprint $table) {
            $table->string('name')->nullable()->after('metal_id');
            $table->string('slug')->nullable()->after('name');
        });

        // Copy data from label to name and generate slugs for existing rows
        \DB::table('metal_purities')->get()->each(function ($purity) {
            $name = $purity->label;
            $slug = \Illuminate\Support\Str::slug($name);

            // Ensure slug is unique per metal_id
            $counter = 1;
            $baseSlug = $slug;
            while (\DB::table('metal_purities')
                ->where('metal_id', $purity->metal_id)
                ->where('slug', $slug)
                ->where('id', '!=', $purity->id)
                ->exists()
            ) {
                $slug = $baseSlug . '-' . $counter++;
            }

            \DB::table('metal_purities')
                ->where('id', $purity->id)
                ->update([
                    'name' => $name,
                    'slug' => $slug,
                ]);
        });

        // Now make name and slug NOT NULL using raw SQL (PostgreSQL requires this)
        \DB::statement('ALTER TABLE metal_purities ALTER COLUMN name SET NOT NULL');
        \DB::statement('ALTER TABLE metal_purities ALTER COLUMN slug SET NOT NULL');

        // Add unique constraints
        Schema::table('metal_purities', function (Blueprint $table) {
            // Add unique constraint on metal_id + name
            $table->unique(['metal_id', 'name']);

            // Add unique constraint on metal_id + slug
            $table->unique(['metal_id', 'slug']);
        });

        // Finally, drop the label column
        Schema::table('metal_purities', function (Blueprint $table) {
            $table->dropColumn('label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the new unique constraints
        Schema::table('metal_purities', function (Blueprint $table) {
            $table->dropUnique(['metal_id', 'slug']);
            $table->dropUnique(['metal_id', 'name']);
        });

        // Add back label column as nullable first
        Schema::table('metal_purities', function (Blueprint $table) {
            $table->string('label')->nullable()->after('metal_id');
        });

        // Copy data from name to label for existing rows
        \DB::table('metal_purities')->get()->each(function ($purity) {
            \DB::table('metal_purities')
                ->where('id', $purity->id)
                ->update([
                    'label' => $purity->name,
                ]);
        });

        // Make label NOT NULL using raw SQL
        \DB::statement('ALTER TABLE metal_purities ALTER COLUMN label SET NOT NULL');

        // Add unique constraint
        Schema::table('metal_purities', function (Blueprint $table) {
            $table->unique(['metal_id', 'label']);
        });

        // Drop name and slug columns
        Schema::table('metal_purities', function (Blueprint $table) {
            $table->dropColumn(['name', 'slug']);
        });
    }
};
