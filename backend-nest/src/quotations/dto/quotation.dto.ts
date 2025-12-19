import { IsString, IsOptional, IsInt, Min, IsNotEmpty, IsNumberString, IsArray } from 'class-validator';

export class CreateQuotationDto {
  @IsNotEmpty()
  @IsInt()
  product_id: number;

  @IsOptional()
  @IsInt()
  product_variant_id?: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class StoreQuotationMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class QuotationFilterDto {
  @IsOptional()
  @IsString()
  order_reference?: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsString()
  customer_email?: string;

  @IsOptional()
  @IsString()
  page?: string;
}

export class ApproveQuotationDto {
  @IsString()
  @IsOptional()
  admin_notes?: string;
}

export class RequestConfirmationDto {
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsInt()
  product_variant_id?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateQuotationProductDto {
  @IsNotEmpty()
  @IsInt()
  product_id: number;

  @IsOptional()
  @IsInt()
  product_variant_id?: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}

export class AddQuotationItemDto {
  @IsNotEmpty()
  @IsInt()
  product_id: number;

  @IsOptional()
  @IsInt()
  product_variant_id?: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}


