import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsIn } from 'class-validator';

export class RegisterDto {
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
  @MaxLength(25)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['retailer', 'wholesaler'])
  account_type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  business_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  website?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  gst_number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  pan_number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  registration_number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address_line1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address_line2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postal_code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  contact_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(25)
  contact_phone?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  password_confirmation: string;
}

