import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsNotEmpty,
    IsDateString,
    IsObject,
} from 'class-validator';

export class CreateOfferDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsNumber()
    @IsNotEmpty()
    value: number;

    @IsObject()
    @IsOptional()
    constraints?: any;

    @IsDateString()
    @IsOptional()
    starts_at?: string;

    @IsDateString()
    @IsOptional()
    ends_at?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class UpdateOfferDto {
    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    value?: number;

    @IsObject()
    @IsOptional()
    constraints?: any;

    @IsDateString()
    @IsOptional()
    starts_at?: string;

    @IsDateString()
    @IsOptional()
    ends_at?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
