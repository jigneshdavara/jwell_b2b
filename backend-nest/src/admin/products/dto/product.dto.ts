import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    IsNumber,
    IsArray,
    IsNotEmpty,
    MaxLength,
    ValidateNested,
    Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Media DTO (for create)
export class ProductMediaDto {
    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsInt()
    @Min(0)
    @Transform(({ value }) => parseInt(value))
    display_order: number;

    @IsOptional()
    metadata?: Record<string, unknown>;
}

// Media DTO (for update - ID optional for new items)
export class UpdateProductMediaDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    id?: number;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsNotEmpty()
    url: string;

    @IsInt()
    @Min(0)
    @Transform(({ value }) => parseInt(value))
    display_order: number;

    @IsOptional()
    metadata?: Record<string, unknown>;
}

// Variant Metal DTO (for create)
export class VariantMetalDto {
    @IsInt()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    metal_id: number;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    })
    metal_purity_id?: number | null;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    })
    metal_tone_id?: number | null;

    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? undefined : parsed;
    })
    metal_weight: number;

    @IsOptional()
    metadata?: Record<string, unknown>;
}

// Variant Metal DTO (for update - ID optional for new items)
export class UpdateVariantMetalDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    id?: number;

    @IsInt()
    @IsNotEmpty()
    @Transform(({ value }) => parseInt(value))
    metal_id: number;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    })
    metal_purity_id?: number | null;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    })
    metal_tone_id?: number | null;

    @IsNumber()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? undefined : parsed;
    })
    metal_weight: number;

    @IsOptional()
    metadata?: Record<string, unknown>;
}

// Variant Diamond DTO (for create)
export class VariantDiamondDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    })
    diamond_id?: number | null;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    diamonds_count: number;

    @IsOptional()
    metadata?: Record<string, unknown>;
}

// Variant Diamond DTO (for update - ID optional for new items)
export class UpdateVariantDiamondDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    id?: number;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    })
    diamond_id?: number | null;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    diamonds_count: number;

    @IsOptional()
    metadata?: Record<string, unknown>;
}

// Variant DTO (for create)
export class ProductVariantDto {
    @IsString()
    @IsOptional()
    @MaxLength(191)
    sku?: string | null;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    label: string;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    })
    size_id?: number | null;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    inventory_quantity: number;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    is_default?: boolean;

    @IsOptional()
    metadata?: Record<string, unknown>;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantMetalDto)
    metals: VariantMetalDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantDiamondDto)
    diamonds: VariantDiamondDto[];
}

// Variant DTO (for update - ID optional for new items)
export class UpdateProductVariantDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    id?: number;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    sku?: string | null;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    label: string;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    })
    size_id?: number | null;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    inventory_quantity: number;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    is_default?: boolean;

    @IsOptional()
    metadata?: Record<string, unknown>;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateVariantMetalDto)
    metals: UpdateVariantMetalDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateVariantDiamondDto)
    diamonds: UpdateVariantDiamondDto[];
}

// Create Product DTO
export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    sku: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    titleline?: string | null;

    @IsInt()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    brand_id: number;

    @IsInt()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    category_id: number;

    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (Array.isArray(value)) {
            return value.map((v) => parseInt(v));
        }
        return value ? [parseInt(value)] : [];
    })
    subcategory_ids?: number[];

    @IsOptional()
    @Transform(({ value }) => {
        // Interceptor should parse JSON, but handle edge cases here
        if (Array.isArray(value)) {
            return value
                .map((v) => parseInt(String(v), 10))
                .filter((v) => !isNaN(v));
        }
        if (!value || value === '' || value === '[]') {
            return [];
        }
        return [];
    })
    @IsArray()
    @IsInt({ each: true })
    style_ids?: number[];

    @IsOptional()
    @Transform(({ value }) => {
        // Interceptor should parse JSON, but handle edge cases here
        if (Array.isArray(value)) {
            return value
                .map((v) => parseInt(String(v), 10))
                .filter((v) => !isNaN(v));
        }
        if (!value || value === '' || value === '[]') {
            return [];
        }
        return [];
    })
    @IsArray()
    @IsInt({ each: true })
    catalog_ids?: number[];

    @IsString()
    @IsOptional()
    description?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    collection?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    producttype?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    gender?: string | null;

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    })
    making_charge_amount?: number | null;

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    })
    making_charge_percentage?: number | null;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    is_active?: boolean;

    @IsOptional()
    metadata?: Record<string, unknown>;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductMediaDto)
    @IsOptional()
    media?: ProductMediaDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductVariantDto)
    variants?: ProductVariantDto[];
}

// Update Product DTO
export class UpdateProductDto {
    @IsString()
    @IsOptional()
    @MaxLength(191)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    sku?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    titleline?: string | null;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    brand_id?: number;

    @IsInt()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    category_id?: number;

    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return undefined;
        if (Array.isArray(value)) {
            return value.map((v) => parseInt(v));
        }
        return [parseInt(value)];
    })
    subcategory_ids?: number[];

    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return undefined;
        if (Array.isArray(value)) {
            return value.map((v) => parseInt(v));
        }
        return [parseInt(value)];
    })
    style_ids?: number[];

    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return undefined;
        if (Array.isArray(value)) {
            return value.map((v) => parseInt(v));
        }
        return [parseInt(value)];
    })
    catalog_ids?: number[];

    @IsString()
    @IsOptional()
    description?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    collection?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    producttype?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    gender?: string | null;

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    })
    making_charge_amount?: number | null;

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return null;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    })
    making_charge_percentage?: number | null;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    is_active?: boolean;

    @IsOptional()
    metadata?: Record<string, unknown>;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateProductMediaDto)
    @IsOptional()
    media?: UpdateProductMediaDto[];

    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (!value) return undefined;
        if (Array.isArray(value)) {
            return value.map((v) => parseInt(v));
        }
        return [parseInt(value)];
    })
    removed_media_ids?: number[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateProductVariantDto)
    variants?: UpdateProductVariantDto[];
}

// Delete Product DTO (for single delete)
export class DeleteProductDto {
    @IsInt()
    @IsNotEmpty()
    @Transform(({ value }) => {
        if (value === '' || value === null || value === undefined) {
            return undefined;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? undefined : parsed;
    })
    id: number;
}

// Bulk Destroy DTO
export class BulkDestroyDto {
    @IsArray()
    @IsInt({ each: true })
    @Transform(({ value }) => {
        if (!value) return [];
        if (Array.isArray(value)) {
            return value
                .map((v) => parseInt(String(v), 10))
                .filter((v) => !isNaN(v));
        }
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value) as unknown;
                if (Array.isArray(parsed)) {
                    return (parsed as unknown[])
                        .map((v) => parseInt(String(v), 10))
                        .filter((v) => !isNaN(v));
                }
            } catch {
                // If JSON parse fails, try single value
                const parsed = parseInt(value, 10);
                return isNaN(parsed) ? [] : [parsed];
            }
        }
        return [];
    })
    ids: number[];
}

// Product Detail Response DTO (matches the structure you provided)
export class ProductDetailResponseDto {
    id: number;
    name: string;
    sku: string;
    titleline: string | null;
    brand_id: number;
    category_id: number;
    subcategory_ids: number[];
    style_ids: number[];
    catalog_ids: number[];
    description: string | null;
    collection: string | null;
    producttype: string | null;
    gender: string | null;
    making_charge_amount: number | null;
    making_charge_percentage: number | null;
    is_active: boolean;
    metadata: Record<string, unknown>;
    media: Array<{
        id: number;
        type: string;
        url: string;
        display_order: number;
        metadata: Record<string, unknown>;
    }>;
    variants: Array<{
        id: number;
        sku: string | null;
        label: string;
        size_id: number | null;
        inventory_quantity: number;
        is_default: boolean;
        metadata: Record<string, unknown>;
        metals: Array<{
            id: number;
            metal_id: number;
            metal_purity_id: number | null;
            metal_tone_id: number | null;
            metal_weight: number;
            metadata: Record<string, unknown>;
        }>;
        diamonds: Array<{
            id: number;
            diamond_id: number | null;
            diamonds_count: number;
            metadata: Record<string, unknown>;
        }>;
    }>;
}
