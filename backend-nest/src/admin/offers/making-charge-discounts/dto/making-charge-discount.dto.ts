import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsNotEmpty,
    IsDateString,
    IsInt,
    IsArray,
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
    @IsOptional()
    brand_id?: number;

    @IsInt()
    @IsOptional()
    category_id?: number;

    @IsInt()
    @IsOptional()
    user_group_id?: number;

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
    @IsOptional()
    brand_id?: number;

    @IsInt()
    @IsOptional()
    category_id?: number;

    @IsInt()
    @IsOptional()
    user_group_id?: number;

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
