import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePaymentSettingsDto {
    @IsString()
    @IsOptional()
    publishable_key?: string;

    @IsString()
    @IsOptional()
    secret_key?: string;

    @IsString()
    @IsOptional()
    webhook_secret?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

