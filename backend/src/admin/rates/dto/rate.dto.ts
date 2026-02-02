import {
    IsString,
    IsOptional,
    IsNumber,
    IsArray,
    ValidateNested,
    IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RateItemDto {
    @IsString()
    @IsNotEmpty()
    purity: string;

    @IsNumber()
    @IsNotEmpty()
    price_per_gram: number;

    @IsString()
    @IsOptional()
    currency?: string;
}

export class UpdateMetalRatesDto {
    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    source?: string;

    @IsString()
    @IsOptional()
    effective_at?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RateItemDto)
    rates: RateItemDto[];
}
