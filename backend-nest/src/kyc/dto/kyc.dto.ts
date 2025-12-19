import {
    IsString,
    IsOptional,
    IsEmail,
    IsNotEmpty,
    MaxLength,
} from 'class-validator';

export class UpdateKycProfileDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    business_name: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    business_website?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    gst_number?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    pan_number?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    registration_number?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    address_line1?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    address_line2?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    city?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    state?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    postal_code?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    country?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    contact_name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    contact_phone?: string;
}

export class UpdateKycStatusDto {
    @IsString()
    @IsNotEmpty()
    status: 'pending' | 'review' | 'approved' | 'rejected';

    @IsString()
    @IsOptional()
    remarks?: string;
}
