import { IsInt, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AddWishlistItemDto {
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    product_id: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    product_variant_id?: number;

    @IsOptional()
    configuration?: Record<string, any>;
}

export class MoveToCartDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    quantity?: number;
}

