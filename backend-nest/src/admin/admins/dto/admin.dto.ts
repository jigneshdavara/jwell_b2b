import { IsString, IsOptional, IsEmail, IsNotEmpty, MaxLength, IsEnum, IsInt, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export enum UserType {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super-admin',
  PRODUCTION = 'production',
  SALES = 'sales',
}

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(191)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(UserType)
  @IsOptional()
  type?: UserType;

  @IsInt()
  @IsOptional()
  admin_group_id?: number;
}

export class UpdateAdminDto {
  @IsString()
  @IsOptional()
  @MaxLength(191)
  name?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(191)
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsEnum(UserType)
  @IsOptional()
  type?: UserType;

  @IsInt()
  @IsOptional()
  admin_group_id?: number;
}

export class UpdateAdminGroupDto {
  @IsInt()
  @IsOptional()
  admin_group_id?: number | null;
}

export class BulkDestroyDto {
  @IsInt({ each: true })
  ids: number[];
}
