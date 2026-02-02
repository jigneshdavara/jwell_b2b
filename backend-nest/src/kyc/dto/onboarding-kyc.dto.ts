import {
    IsString,
    IsOptional,
    MaxLength,
    IsIn,
    IsNotEmpty,
} from 'class-validator';

export class UpdateOnboardingKycProfileDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    business_name: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    business_website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    gst_number?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    pan_number?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    registration_number?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    address_line1?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    address_line2?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    state?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    postal_code?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    country?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    contact_name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(25)
    contact_phone?: string;
}

export class StoreKycDocumentDto {
    @IsString()
    @IsNotEmpty()
    @IsIn([
        'gst_certificate',
        'trade_license',
        'pan_card',
        'aadhaar',
        'bank_statement',
        'store_photos',
    ])
    document_type: string;
}

export class SendKycMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    message: string;
}

// Document types constant
export const KYC_DOCUMENT_TYPES = [
    'gst_certificate',
    'trade_license',
    'pan_card',
    'aadhaar',
    'bank_statement',
    'store_photos',
] as const;
