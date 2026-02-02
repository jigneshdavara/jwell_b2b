import {
    IsString,
    IsOptional,
    IsEmail,
    MaxLength,
    IsNotEmpty,
    IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateGeneralSettingsDto {
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    admin_email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    company_name: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    company_address?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    company_city?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    company_state?: string;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    company_pincode?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    company_phone?: string;

    @IsEmail()
    @IsOptional()
    @MaxLength(255)
    company_email?: string;

    @IsString()
    @IsOptional()
    @MaxLength(15)
    company_gstin?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    studio_hours?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    app_name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    app_timezone: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(3)
    app_currency: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    remove_logo?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    remove_favicon?: boolean;
}
