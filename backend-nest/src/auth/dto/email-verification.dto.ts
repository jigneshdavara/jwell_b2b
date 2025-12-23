import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    hash: string;
}

export class ResendVerificationDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}


