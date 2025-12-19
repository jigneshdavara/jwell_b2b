import { IsOptional, IsString, IsArray, IsNumber, IsIn, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Helper to transform string or array to array
const toArray = ({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return [value];
};

export class CatalogFilterDto {
    @IsOptional()
    @Transform(toArray)
    @IsArray()
    @IsString({ each: true })
    brand?: string[];

    @IsOptional()
    @Transform(toArray)
    @IsArray()
    @IsString({ each: true })
    metal?: string[];

    @IsOptional()
    @Transform(toArray)
    @IsArray()
    @IsString({ each: true })
    metal_purity?: string[];

    @IsOptional()
    @Transform(toArray)
    @IsArray()
    @IsString({ each: true })
    metal_tone?: string[];

    @IsOptional()
    @Transform(toArray)
    @IsArray()
    @IsString({ each: true })
    diamond?: string[];

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price_min?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price_max?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(toArray)
    @IsArray()
    category?: (string | number)[];

    @IsOptional()
    @Transform(toArray)
    @IsArray()
    catalog?: (string | number)[];

    @IsOptional()
    @IsString()
    @IsIn(['newest', 'price_asc', 'price_desc', 'name_asc'])
    sort?: string;

    @IsOptional()
    @IsString()
    ready_made?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;
}

export class CalculatePriceDto {
    @IsOptional()
    @IsString()
    variant_id?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    quantity?: number;

    @IsOptional()
    @Type(() => Number)
    customer_group_id?: number;

    @IsOptional()
    @IsString()
    customer_type?: string;
}

