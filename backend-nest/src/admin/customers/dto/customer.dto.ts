import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CustomerFilterDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  customer_group_id?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  only_active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  per_page?: number = 20;
}

export class UpdateCustomerStatusDto {
  @IsString()
  kyc_status: string;

  @IsOptional()
  @IsString()
  kyc_notes?: string;
}

export class UpdateCustomerGroupDto {
  @IsInt()
  customer_group_id: number;
}

