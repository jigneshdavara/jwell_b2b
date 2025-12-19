import {
    IsString,
    IsEmail,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    IsIn,
    Matches,
} from 'class-validator';

export class UpdateProfileDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    name: string;

    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @IsOptional()
    @IsString()
    @IsIn(['en', 'hi', 'gu'])
    preferred_language?: string;
}

export class DeleteProfileDto {
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class ProfileResponseDto {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    preferred_language?: string | null;
    email_verified_at?: string | null;
    type: string;
    kyc_status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

