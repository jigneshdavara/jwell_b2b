<?php

namespace App\Console\Commands;

use App\Models\Metal;
use App\Models\MetalPurity;
use App\Models\MetalTone;
use App\Models\ProductVariant;
use App\Models\ProductVariantDiamond;
use App\Models\ProductVariantMetal;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MigrateVariantMetalsAndDiamonds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'variants:migrate-metals-diamonds {--dry-run : Run without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate legacy metal_tone and stone_quality data from product_variants to new tables';

    protected $metalCache = [];
    protected $purityCache = [];
    protected $toneCache = [];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        $this->info('Starting migration of variant metals and diamonds...');

        // Initialize metals if they don't exist
        $this->initializeMetals();

        // Get all variants with legacy data
        $variants = ProductVariant::query()
            ->where(function ($query) {
                $query->whereNotNull('metal_tone')
                    ->orWhereNotNull('stone_quality');
            })
            ->whereDoesntHave('metals')
            ->whereDoesntHave('diamonds')
            ->get();

        $this->info("Found {$variants->count()} variants to migrate");

        $bar = $this->output->createProgressBar($variants->count());
        $bar->start();

        $migrated = 0;
        $skipped = 0;

        foreach ($variants as $variant) {
            try {
                if (! $dryRun) {
                    DB::beginTransaction();
                }

                // Migrate metals
                if ($variant->metal_tone) {
                    $this->migrateMetalTone($variant);
                }

                // Migrate diamonds
                if ($variant->stone_quality) {
                    $this->migrateStoneQuality($variant);
                }

                if (! $dryRun) {
                    DB::commit();
                }
                $migrated++;
            } catch (\Exception $e) {
                if (! $dryRun) {
                    DB::rollBack();
                }
                $this->newLine();
                $this->error("Failed to migrate variant {$variant->id}: {$e->getMessage()}");
                $skipped++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Migration complete! Migrated: {$migrated}, Skipped: {$skipped}");
    }

    protected function initializeMetals(): void
    {
        $metals = [
            ['name' => 'Gold', 'slug' => 'gold'],
            ['name' => 'Silver', 'slug' => 'silver'],
            ['name' => 'Platinum', 'slug' => 'platinum'],
        ];

        foreach ($metals as $metalData) {
            $metal = Metal::firstOrCreate(
                ['slug' => $metalData['slug']],
                ['name' => $metalData['name'], 'is_active' => true, 'position' => 0]
            );
            $this->metalCache[$metalData['slug']] = $metal;
        }

        $this->info('Initialized metals: Gold, Silver, Platinum');
    }

    protected function migrateMetalTone(ProductVariant $variant): void
    {
        $metalTone = trim($variant->metal_tone ?? '');
        if (empty($metalTone)) {
            return;
        }

        // Parse patterns like "22K Yellow", "18K Rose", "18K White", etc.
        // Or simple patterns like "Gold", "Silver"

        // Try to extract purity and tone
        $purity = null;
        $tone = null;
        $metal = $this->metalCache['gold'] ?? Metal::where('slug', 'gold')->first();

        // Match patterns like "22K Yellow", "18K Rose", "925 Silver"
        if (preg_match('/^(\d+K?|\d{3})\s*(.+)$/i', $metalTone, $matches)) {
            $purityStr = trim($matches[1]);
            $toneStr = trim($matches[2]);

            // Determine metal based on purity
            if (str_contains(strtolower($metalTone), 'silver') || str_starts_with($purityStr, '925')) {
                $metal = $this->metalCache['silver'] ?? Metal::where('slug', 'silver')->first();
                $purityStr = '925';
            } elseif (str_contains(strtolower($metalTone), 'platinum')) {
                $metal = $this->metalCache['platinum'] ?? Metal::where('slug', 'platinum')->first();
            }

            // Create or get purity
            $cacheKey = "{$metal->id}-{$purityStr}";
            if (! isset($this->purityCache[$cacheKey])) {
                $purity = MetalPurity::firstOrCreate(
                    [
                        'metal_id' => $metal->id,
                        'name' => $purityStr,
                    ],
                    [
                        'code' => $purityStr,
                        'is_active' => true,
                        'display_order' => 0,
                    ]
                );
                $this->purityCache[$cacheKey] = $purity;
            } else {
                $purity = $this->purityCache[$cacheKey];
            }

            // Create or get tone
            $toneCacheKey = "{$metal->id}-{$toneStr}";
            if (! isset($this->toneCache[$toneCacheKey])) {
                $tone = MetalTone::firstOrCreate(
                    [
                        'metal_id' => $metal->id,
                        'name' => $toneStr,
                    ],
                    [
                        'is_active' => true,
                        'position' => 0,
                    ]
                );
                $this->toneCache[$toneCacheKey] = $tone;
            } else {
                $tone = $this->toneCache[$toneCacheKey];
            }
        } else {
            // Simple metal name without purity/tone
            if (str_contains(strtolower($metalTone), 'silver')) {
                $metal = $this->metalCache['silver'] ?? Metal::where('slug', 'silver')->first();
            } elseif (str_contains(strtolower($metalTone), 'platinum')) {
                $metal = $this->metalCache['platinum'] ?? Metal::where('slug', 'platinum')->first();
            }
        }

        // Create ProductVariantMetal
        if ($metal) {
            ProductVariantMetal::create([
                'product_variant_id' => $variant->id,
                'metal_id' => $metal->id,
                'metal_purity_id' => $purity?->id,
                'metal_tone_id' => $tone?->id,
                'position' => 0,
            ]);
        }
    }

    protected function migrateStoneQuality(ProductVariant $variant): void
    {
        $stoneQuality = trim($variant->stone_quality ?? '');
        if (empty($stoneQuality)) {
            return;
        }

        // Map common stone quality strings to diamond clarity
        // This is a best-effort mapping - may need adjustment based on actual data
        $clarityMap = [
            'vvs' => 'VVS',
            'vs' => 'VS',
            'si' => 'SI',
            'i' => 'I',
            'fl' => 'FL',
            'if' => 'IF',
        ];

        $clarity = null;
        foreach ($clarityMap as $key => $value) {
            if (stripos($stoneQuality, $key) !== false) {
                // Try to find matching clarity
                $clarity = DB::table('diamond_clarities')
                    ->where('name', 'like', "%{$value}%")
                    ->orWhere('slug', 'like', "%{$key}%")
                    ->first();
                break;
            }
        }

        // Create ProductVariantDiamond
        ProductVariantDiamond::create([
            'product_variant_id' => $variant->id,
            'diamond_clarity_id' => $clarity?->id,
            'position' => 0,
            'metadata' => [
                'migrated_from' => 'stone_quality',
                'original_value' => $stoneQuality,
            ],
        ]);
    }
}
