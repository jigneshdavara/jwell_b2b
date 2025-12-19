import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
    IsNotEmpty,
    IsNumber,
} from 'class-validator';

export class CreateDiamondDto {
    @IsInt()
    @IsNotEmpty()
    diamond_type_id: number;

    @IsInt()
    @IsNotEmpty()
    diamond_shape_id: number;

    @IsInt()
    @IsNotEmpty()
    diamond_clarity_id: number;

    @IsInt()
    @IsNotEmpty()
    diamond_color_id: number;

    @IsInt()
    @IsNotEmpty()
    diamond_shape_size_id: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    code: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    display_order: number;
}

export class UpdateDiamondDto {
    @IsInt()
    @IsOptional()
    diamond_type_id?: number;

    @IsInt()
    @IsOptional()
    diamond_shape_id?: number;

    @IsInt()
    @IsOptional()
    diamond_clarity_id?: number;

    @IsInt()
    @IsOptional()
    diamond_color_id?: number;

    @IsInt()
    @IsOptional()
    diamond_shape_size_id?: number;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    code?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    price?: number;

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
