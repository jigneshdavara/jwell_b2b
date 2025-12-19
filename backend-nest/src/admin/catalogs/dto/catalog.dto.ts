import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty, IsArray } from 'class-validator';

export class CreateCatalogDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsNotEmpty()
  display_order: number;
}

export class UpdateCatalogDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsInt()
  @IsOptional()
  display_order?: number;
}

export class BulkDestroyCatalogsDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}

export class AssignProductsToCatalogDto {
  @IsArray()
  @IsInt({ each: true })
  product_ids: number[];
}


