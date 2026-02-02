import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsNotEmpty,
    IsDateString,
    IsInt,
    IsArray,
    ValidateIf,
} from 'class-validator';

export class CreateMakingChargeDiscountDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    discount_type: string;

    @IsNumber()
    @IsNotEmpty()
    value: number;

    @IsInt()
    @ValidateIf((o) => o.brand_id !== null && o.brand_id !== undefined)
    @IsOptional()
    brand_id?: number | null;

    @IsInt()
    @ValidateIf((o) => o.category_id !== null && o.category_id !== undefined)
    @IsOptional()
    category_id?: number | null;

    @IsInt()
    @ValidateIf((o) => o.user_group_id !== null && o.user_group_id !== undefined)
    @IsOptional()
    user_group_id?: number | null;

    @IsNumber()
    @IsOptional()
    min_cart_total?: number;

    @IsBoolean()
    @IsOptional()
    is_auto?: boolean;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsDateString()
    @IsOptional()
    starts_at?: string;

    @IsDateString()
    @IsOptional()
    ends_at?: string;

    @IsArray()
    @IsOptional()
    user_types?: string[];
}

export class UpdateMakingChargeDiscountDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    discount_type?: string;

    @IsNumber()
    @IsOptional()
    value?: number;

    @IsInt()
    @ValidateIf((o) => o.brand_id !== null && o.brand_id !== undefined)
    @IsOptional()
    brand_id?: number | null;

    @IsInt()
    @ValidateIf((o) => o.category_id !== null && o.category_id !== undefined)
    @IsOptional()
    category_id?: number | null;

    @IsInt()
    @ValidateIf((o) => o.user_group_id !== null && o.user_group_id !== undefined)
    @IsOptional()
    user_group_id?: number | null;

    @IsNumber()
    @IsOptional()
    min_cart_total?: number;

    @IsBoolean()
    @IsOptional()
    is_auto?: boolean;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsDateString()
    @IsOptional()
    starts_at?: string;

    @IsDateString()
    @IsOptional()
    ends_at?: string;

    @IsArray()
    @IsOptional()
    user_types?: string[];
}

export class BulkDestroyDto {
    @IsArray()
    @IsInt({ each: true })
    ids: number[];
}
