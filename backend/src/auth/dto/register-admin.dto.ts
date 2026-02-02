import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    IsEnum,
    IsInt,
} from 'class-validator';
import { AdminType } from '../../admin/admins/dto/admin.dto';

export class RegisterAdminDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsString()
    @IsNotEmpty()
    password_confirmation: string;

    @IsEnum(AdminType)
    @IsOptional()
    type?: AdminType;

    @IsInt()
    @IsOptional()
    admin_group_id?: number;
}
