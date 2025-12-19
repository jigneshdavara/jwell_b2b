import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateCustomerGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  position?: number;
}

export class UpdateCustomerGroupDto {
  @IsString()
  @IsOptional()
  @MaxLength(191)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  position?: number;
}

export class BulkDestroyDto {
  @IsInt({ each: true })
  ids: number[];
}

