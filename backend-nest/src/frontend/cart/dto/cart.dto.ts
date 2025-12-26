import {
    IsInt,
    IsOptional,
    IsNumber,
    IsObject,
    IsString,
    Min,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConfigurationDto {
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

export class AddCartItemDto {
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
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    @Min(1)
    quantity?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => ConfigurationDto)
    configuration?: ConfigurationDto;
}

export class UpdateCartItemDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    @Min(1)
    quantity?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => ConfigurationDto)
    configuration?: ConfigurationDto;
}
