import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsNotEmpty,
    IsDateString,
    IsInt,
    IsArray,
    IsJson,
} from 'class-validator';
import { Transform } from 'class-transformer';

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
    customer_group_id?: number;

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
    customer_types?: string[];
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
    customer_group_id?: number;

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
    customer_types?: string[];
}

export class BulkDestroyDto {
    @IsArray()
    @IsInt({ each: true })
    ids: number[];
}
