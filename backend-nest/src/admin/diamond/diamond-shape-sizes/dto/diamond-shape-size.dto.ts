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

export class CreateDiamondShapeSizeDto {
    @IsInt()
    @IsNotEmpty()
    diamond_type_id: number;

    @IsInt()
    @IsNotEmpty()
    diamond_shape_id: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    size: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    secondary_size?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    display_order: number;

    @IsNumber()
    @IsOptional()
    ctw?: number;
}

export class UpdateDiamondShapeSizeDto {
    @IsInt()
    @IsOptional()
    diamond_type_id?: number;

    @IsInt()
    @IsOptional()
    diamond_shape_id?: number;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    size?: string;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    secondary_size?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @IsOptional()
    @Min(0)
    display_order?: number;

    @IsNumber()
    @IsOptional()
    ctw?: number;
}

export class BulkDestroyDto {
    @IsInt({ each: true })
    ids: number[];
}
