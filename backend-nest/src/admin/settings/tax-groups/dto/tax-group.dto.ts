import {
    IsString,
    IsOptional,
    IsBoolean,
    MaxLength,
    IsNotEmpty,
} from 'class-validator';

export class CreateTaxGroupDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class UpdateTaxGroupDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
