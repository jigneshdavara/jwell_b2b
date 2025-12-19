import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsNotEmpty,
    IsArray,
    IsInt,
    IsObject,
    ValidateNested,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariantMetalDto {
    @IsInt()
    @IsOptional()
    id?: number;

    @IsInt()
    @IsNotEmpty()
    metal_id: number;

    @IsInt()
    @IsOptional()
    metal_purity_id?: number;

    @IsInt()
    @IsOptional()
    metal_tone_id?: number;

    @IsNumber()
    @IsOptional()
    metal_weight?: number;

    @IsObject()
    @IsOptional()
    metadata?: any;
}

export class VariantDiamondDto {
    @IsInt()
    @IsOptional()
    id?: number;

    @IsInt()
    @IsNotEmpty()
    diamond_id: number;

    @IsInt()
    @IsOptional()
    diamonds_count?: number;

    @IsObject()
    @IsOptional()
    metadata?: any;
}

export class ProductVariantDto {
    @IsInt()
    @IsOptional()
    id?: number;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsString()
    @IsNotEmpty()
    label: string;

    @IsInt()
    @IsOptional()
    size_id?: number;

    @IsInt()
    @IsOptional()
    inventory_quantity?: number;

    @IsBoolean()
    @IsOptional()
    is_default?: boolean;

    @IsObject()
    @IsOptional()
    metadata?: any;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantMetalDto)
    metals: VariantMetalDto[];

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => VariantDiamondDto)
    diamonds?: VariantDiamondDto[];
}

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    titleline?: string;

    @IsInt()
    @IsNotEmpty()
    brand_id: number;

    @IsInt()
    @IsNotEmpty()
    category_id: number;

    @IsArray()
    @IsOptional()
    category_ids?: number[];

    @IsArray()
    @IsOptional()
    style_ids?: number[];

    @IsString()
    @IsOptional()
    collection?: string;

    @IsString()
    @IsOptional()
    producttype?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsNotEmpty()
    sku: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    making_charge_amount?: number;

    @IsNumber()
    @IsOptional()
    making_charge_percentage?: number;

    @IsArray()
    @IsOptional()
    making_charge_types?: string[];

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsObject()
    @IsOptional()
    metadata?: any;

    @IsArray()
    @IsOptional()
    catalog_ids?: number[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductVariantDto)
    variants: ProductVariantDto[];

    @IsArray()
    @IsOptional()
    removed_media_ids?: number[];
}

export class UpdateProductDto extends CreateProductDto {}

export class BulkActionDto {
    @IsArray()
    @IsInt({ each: true })
    ids: number[];
}

export class BulkStatusDto extends BulkActionDto {
    @IsEnum(['activate', 'deactivate'])
    action: string;
}

export class ProductFilterDto {
    @IsString()
    @IsOptional()
    search?: string;

    @IsEnum(['active', 'inactive'])
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    page?: string;

    @IsString()
    @IsOptional()
    per_page?: string;
}
