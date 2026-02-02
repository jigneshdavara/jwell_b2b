import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
} from 'class-validator';

export class CreateOrderStatusDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    @MaxLength(191)
    code: string;

    @IsString()
    @MaxLength(7)
    @IsOptional()
    color?: string;

    @IsBoolean()
    @IsOptional()
    is_default?: boolean;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    display_order?: number;
}

export class UpdateOrderStatusDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    name?: string;

    @IsString()
    @MaxLength(191)
    @IsOptional()
    code?: string;

    @IsString()
    @MaxLength(7)
    @IsOptional()
    color?: string;

    @IsBoolean()
    @IsOptional()
    is_default?: boolean;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    display_order?: number;
}

export class BulkDestroyOrderStatusesDto {
    @IsInt({ each: true })
    ids: number[];
}
