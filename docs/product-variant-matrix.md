# Product Variant Generation Matrix

## Overview

The Product Variant Generation Matrix is a system that automatically generates all possible combinations of product variants based on selected attributes. This system allows administrators to quickly create multiple product variants by selecting different combinations of metals, purities, diamond options, and sizes.

## Architecture

### Components

1. **Frontend (React/TypeScript)**: `resources/js/Pages/Admin/Products/Edit.tsx`
   - `generateVariantMatrix()` function
   - `recalculateVariants()` function
   - `buildVariantMeta()` function

2. **Backend (PHP/Laravel)**: `app/Services/Catalog/ProductVariantSyncService.php`
   - `sync()` method
   - `syncVariantMetals()` method
   - `syncVariantDiamonds()` method

3. **Database Models**:
   - `ProductVariant` - Main variant model
   - `ProductVariantMetal` - Metal associations for variants
   - `ProductVariantDiamond` - Diamond associations for variants

## How It Works

### Step 1: Matrix Generation (Frontend)

The `generateVariantMatrix()` function creates all possible combinations of:

1. **Metal + Purity Combinations**
   - Groups purities by their associated metal
   - Creates combinations: each metal × each of its selected purities
   - If no purities are selected for a metal, creates variants with just the metal (purity_id = 0)

2. **Diamond Options**
   - If `uses_diamond` is enabled, includes all diamond options
   - If disabled, uses `[null]` as a placeholder

3. **Size Options**
   - If `size_dimension_enabled` is true and sizes are provided, includes all size values
   - If disabled, uses `[null]` as a placeholder

### Step 2: Combination Generation

The system generates a Cartesian product of all selected options:

```typescript
metalPurityCombinations × diamondOptions × sizeOptions
```

**Example:**
- Metals: Gold (ID: 1), Silver (ID: 2)
- Purities: 22K (for Gold), 18K (for Gold), 925 (for Silver)
- Diamond Options: "VVS", "VS"
- Sizes: "6", "7", "8"

**Result:** 2 metals × 2 diamond options × 3 sizes = 12 variants

### Step 3: Variant Creation

For each combination, a variant object is created with:

```typescript
{
  metal_id: number,
  metal_purity_id: number,
  diamond_option_key: string | null,
  size_cm: string | null,
  metadata: {
    diamond_option_key: string | null,
    auto_label: string,
    status: 'enabled'
  }
}
```

### Step 4: Label Generation

The `recalculateVariants()` function automatically generates labels for each variant:

**Label Format:** `Diamond Label / Metal Label / Size Label`

**Example Labels:**
- `VVS / 22K Gold / 6cm`
- `VS / 18K Gold / 7cm`
- `VVS / 925 Silver / 8cm`

**Label Components:**

1. **Diamond Label**: Generated from diamond option attributes (type, shape, color, clarity, cut, weight)
2. **Metal Label**: Generated from metal name and purity (e.g., "22K Gold")
3. **Size Label**: Formatted size with unit (e.g., "6cm", "7mm")

### Step 5: SKU Generation

Auto-generated SKUs follow the pattern:
```
{BASE_SKU}-{INDEX}
```

**Example:**
- Base SKU: "RING-001"
- Variants: "RING-001-01", "RING-001-02", "RING-001-03", etc.

### Step 6: Backend Synchronization

When the form is submitted, `ProductVariantSyncService::sync()` processes the variants:

1. **Normalization**: Converts frontend format to database format
2. **Metal Association**: Creates `ProductVariantMetal` records
3. **Diamond Association**: Creates `ProductVariantDiamond` records
4. **Metadata Storage**: Stores variant metadata in JSON format
5. **Cleanup**: Removes variants that are no longer in the matrix

## Data Flow

```
Admin selects options
    ↓
generateVariantMatrix() creates combinations
    ↓
recalculateVariants() generates labels & SKUs
    ↓
Form submission
    ↓
ProductVariantSyncService::sync()
    ↓
Database: product_variants, product_variant_metals, product_variant_diamonds
```

## Key Features

### 2. Flexible Attribute Handling

- **Metals without purities**: Creates variants with `metal_purity_id = 0`
- **No metals but diamonds/sizes**: Creates variants with `metal_id = 0`
- **Diamonds disabled**: Uses `[null]` placeholder
- **Sizes disabled**: Uses `[null]` placeholder

### 3. Metadata Storage

Each variant stores comprehensive metadata:

```json
{
  "metal_id": 1,
  "metal_purity_id": 5,
  "diamond_option_key": "diamond-option-1",
  "diamond": {
    "key": "diamond-option-1",
    "type_id": 1,
    "shape_id": 2,
    "color_id": 3,
    "clarity_id": 4,
    "cut_id": 5,
    "weight": 0.5
  },
  "size_cm": 6.0,
  "size_unit": "cm",
  "auto_label": "VVS / 22K Gold / 6cm",
  "status": "enabled"
}
```

### 4. Relationship Management

**ProductVariant → ProductVariantMetal (One-to-Many)**
- Each variant can have multiple metals
- Metals are stored with position ordering
- Supports metal_tone_id and metal_weight

**ProductVariant → ProductVariantDiamond (One-to-Many)**
- Each variant can have multiple diamond entries
- Diamonds are stored with position ordering
- Supports type, shape, color, clarity, cut, stone_count, total_carat

## Frontend Matching Logic

On the product display page (`Catalog/Show.tsx`), variants are matched based on user selections:

```typescript
const matchingVariant = product.variants.find((variant) => {
    // Match metal
    const variantMetalIds = variant.metals.map(m => m.metal_id);
    if (!variantMetalIds.includes(selectedMetalId)) return false;
    
    // Match metal purity
    const variantPurityIds = variant.metals.map(m => m.metal_purity_id);
    if (!variantPurityIds.includes(selectedMetalPurityId)) return false;
    
    // Match diamond option
    if (variant.metadata.diamond_option_key !== selectedDiamondOption) return false;
    
    // Match size
    if (variant.metadata.size_cm !== selectedSize) return false;
    
    return true;
});
```

## Edge Cases

### 1. No Combinations Available

If no metals, diamonds, or sizes are selected, the matrix generation returns early without creating variants.

### 2. Missing Default Variant

If no variant is marked as default, the first variant is automatically set as default.

### 3. Variant Cleanup

When regenerating the matrix, existing variants not in the new matrix are deleted to maintain data consistency.

### 4. Size Unit Conversion

The system handles size conversion between millimeters (mm) and centimeters (cm):
- Frontend stores sizes in the selected unit
- Backend normalizes to centimeters (cm) in `size_cm` field
- Original unit is preserved in metadata

## Usage Example

### Admin Workflow

1. **Select Metals**: Choose "Gold" and "Silver"
2. **Select Purities**: Choose "22K" (for Gold) and "925" (for Silver)
3. **Enable Diamonds**: Toggle "Uses Diamond" ON
4. **Add Diamond Options**: Add "VVS" and "VS" options
5. **Enable Sizes**: Toggle "Size Dimension" ON
6. **Add Sizes**: Add "6", "7", "8"
7. **Generate Matrix**: Click "Generate Variant Matrix" button
8. **Result**: 2 metals × 2 diamond options × 3 sizes = 12 variants created

### Generated Variants

1. Gold 22K / VVS / 6cm
2. Gold 22K / VVS / 7cm
3. Gold 22K / VVS / 8cm
4. Gold 22K / VS / 6cm
5. Gold 22K / VS / 7cm
6. Gold 22K / VS / 8cm
7. Silver 925 / VVS / 6cm
8. Silver 925 / VVS / 7cm
9. Silver 925 / VVS / 8cm
10. Silver 925 / VS / 6cm
11. Silver 925 / VS / 7cm
12. Silver 925 / VS / 8cm

## Code Locations

- **Frontend Matrix Generation**: `resources/js/Pages/Admin/Products/Edit.tsx` (line 1096)
- **Variant Recalculation**: `resources/js/Pages/Admin/Products/Edit.tsx` (line 581)
- **Backend Sync Service**: `app/Services/Catalog/ProductVariantSyncService.php`
- **Variant Model**: `app/Models/ProductVariant.php`
- **Metal Model**: `app/Models/ProductVariantMetal.php`
- **Diamond Model**: `app/Models/ProductVariantDiamond.php`
- **Frontend Matching**: `resources/js/Pages/Frontend/Catalog/Show.tsx` (line 214)

## Database Schema

### product_variants
- `id` (primary key)
- `product_id` (foreign key)
- `sku` (string)
- `label` (string)
- `is_default` (boolean)
- `metadata` (JSON)

### product_variant_metals
- `id` (primary key)
- `product_variant_id` (foreign key)
- `metal_id` (foreign key)
- `metal_purity_id` (foreign key, nullable)
- `metal_tone_id` (foreign key, nullable)
- `metal_weight` (decimal, nullable)
- `position` (integer)
- `metadata` (JSON)

### product_variant_diamonds
- `id` (primary key)
- `product_variant_id` (foreign key)
- `diamond_type_id` (foreign key, nullable)
- `diamond_shape_id` (foreign key, nullable)
- `diamond_color_id` (foreign key, nullable)
- `diamond_clarity_id` (foreign key, nullable)
- `diamond_cut_id` (foreign key, nullable)
- `stone_count` (integer, nullable)
- `total_carat` (decimal, nullable)
- `position` (integer)
- `metadata` (JSON)

## Best Practices

1. **Always generate matrix before saving**: Ensures all combinations are created
2. **Review generated variants**: Check labels and SKUs are correct
3. **Set default variant**: Mark the most common variant as default
4. **Use meaningful base SKU**: Makes auto-generated SKUs more readable
5. **Group related purities**: Select purities that belong to the same metals
6. **Validate combinations**: Ensure all combinations make business sense

## Troubleshooting

### Issue: No variants generated
**Solution**: Ensure at least one of the following is selected:
- Metals
- Diamond options (if uses_diamond is enabled)
- Size values (if size_dimension_enabled is true)

### Issue: Invalid metal-purity combinations
**Solution**: The system automatically filters purities by metal. Ensure selected purities belong to selected metals.

### Issue: Labels not updating
**Solution**: Labels are auto-generated. If manual labels are set, they won't be overwritten. Clear the label field to enable auto-generation.

### Issue: Variants not matching on frontend
**Solution**: Ensure variant metadata matches selection criteria. Check that `diamond_option_key` and `size_cm` are correctly stored in metadata.




