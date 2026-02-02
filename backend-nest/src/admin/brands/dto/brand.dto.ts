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
import { Transform } from 'class-transformer';

export class CreateBrandDto {
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
    @Transform(({ key, obj }) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const rawValue = obj[key];
        console.log('rawValue', rawValue, typeof rawValue);

        if (typeof rawValue === 'string') {
            return rawValue === 'true';
        }

        if (typeof rawValue === 'boolean') {
            return rawValue;
        }

        return true;
    })
    is_active?: boolean;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    @Transform(({ value }) => parseInt(value))
    display_order: number;
}

export class UpdateBrandDto {
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
    @Transform(({ key, obj }) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const rawValue = obj[key];
        console.log('rawValue', rawValue, typeof rawValue);

        if (typeof rawValue === 'string') {
            return rawValue === 'true';
        }

        if (typeof rawValue === 'boolean') {
            return rawValue;
        }

        return true;
    })
    is_active?: boolean;

    @IsInt()
    @IsOptional()
    @Min(0)
    @Transform(({ value }) => parseInt(value))
    display_order?: number;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    remove_cover_image?: boolean;
}

export class BulkDestroyDto {
    @IsArray()
    @IsInt({ each: true })
    ids: number[];
}
