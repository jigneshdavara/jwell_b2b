import {
    IsString,
    IsEmail,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    IsIn,
    Matches,
    MinLength,
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

export class UpdatePasswordDto {
    @IsNotEmpty()
    @IsString()
    current_password: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;

    @IsNotEmpty()
    @IsString()
    password_confirmation: string;
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
    kyc_status?: string | null; // Optional - admins don't have kyc_status
    is_active: boolean;
    credit_limit?: number | null;
    created_at: string;
    updated_at: string;
}
