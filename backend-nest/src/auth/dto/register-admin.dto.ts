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
import { UserType } from '../../admin/team-users/dto/team-user.dto';

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

    @IsEnum(UserType)
    @IsOptional()
    type?: UserType;

    @IsInt()
    @IsOptional()
    user_group_id?: number;
}
