import {
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,
    IsInt,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuotationDto {
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    product_id: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    product_variant_id?: number;

    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

export class StoreQuotationMessageDto {
    @IsNotEmpty()
    @IsString()
    message: string;
}
