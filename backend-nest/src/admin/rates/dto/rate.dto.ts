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
}

export class UpdateMetalRatesDto {
    @IsString()
    @IsOptional()
    currency?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RateItemDto)
    rates: RateItemDto[];
}
