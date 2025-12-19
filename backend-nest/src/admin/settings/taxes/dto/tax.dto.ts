import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max, MaxLength, IsNotEmpty, IsInt } from 'class-validator';

export class CreateTaxDto {
  @IsInt()
  @IsNotEmpty()
  tax_group_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  rate: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateTaxDto {
  @IsInt()
  @IsOptional()
  tax_group_id?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  rate?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

