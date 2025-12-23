import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
    IsNotEmpty,
    IsArray,
} from 'class-validator';

export class CreateAdminGroupDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsOptional()
    features?: string[];

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    code: string;

    @IsInt()
    @IsOptional()
    @Min(0)
    display_order?: number;
}

export class UpdateAdminGroupDto {
    @IsString()
    @IsOptional()
    @MaxLength(191)
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsOptional()
    features?: string[];

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    code?: string;

    @IsInt()
    @IsOptional()
    @Min(0)
    display_order?: number;
}

export class BulkDestroyDto {
    @IsInt({ each: true })
    ids: number[];
}
