import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateDiamondColorDto {
  @IsInt()
  @IsNotEmpty()
  diamond_type_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  code: string;

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
  @IsNotEmpty()
  @Min(0)
  display_order: number;
}

export class UpdateDiamondColorDto {
  @IsInt()
  @IsOptional()
  diamond_type_id?: number;

  @IsString()
  @IsOptional()
  @MaxLength(191)
  code?: string;

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
  display_order?: number;
}

export class BulkDestroyDto {
  @IsInt({ each: true })
  ids: number[];
}

