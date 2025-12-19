import { IsString, IsOptional, IsEmail, IsNotEmpty, MaxLength, IsEnum, IsInt, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export enum UserType {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super-admin',
  PRODUCTION = 'production',
  SALES = 'sales',
}

export class CreateTeamUserDto {
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
  user_group_id?: number;
}

export class UpdateTeamUserDto {
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
  user_group_id?: number;
}

export class UpdateUserGroupDto {
  @IsInt()
  @IsOptional()
  user_group_id?: number | null;
}

export class BulkDestroyDto {
  @IsInt({ each: true })
  ids: number[];
}

