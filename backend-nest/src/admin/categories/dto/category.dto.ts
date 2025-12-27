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

export class CreateCategoryDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }: { value: string | number | null | undefined }) =>
        value === '' ? null : parseInt(String(value), 10),
    )
    parent_id?: number | null;

    @IsString()
    @IsOptional()
    @MaxLength(191)
    code?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    is_active?: boolean;

    @IsInt()
    @IsOptional()
    @Min(0)
    @Transform(({ value }: { value: string | number | undefined }) =>
        parseInt(String(value), 10),
    )
    display_order?: number;

    @IsArray()
    @IsOptional()
    @Transform(
        ({
            value,
        }: {
            value: string | number[] | undefined;
        }): number[] | undefined => {
            if (typeof value === 'string') {
                return value.split(',').map((v: string) => parseInt(v, 10));
            }
            return value;
        },
    )
    style_ids?: number[];

    @IsArray()
    @IsOptional()
    @Transform(
        ({
            value,
        }: {
            value: string | number[] | undefined;
        }): number[] | undefined => {
            if (typeof value === 'string') {
                return value.split(',').map((v: string) => parseInt(v, 10));
            }
            return value;
        },
    )
    size_ids?: number[];
}

export class UpdateCategoryDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }: { value: string | number | null | undefined }) =>
        value === '' ? null : parseInt(String(value), 10),
    )
    parent_id?: number | null;

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
    @Transform(({ value }) => value === 'true' || value === true)
    is_active?: boolean;

    @IsInt()
    @IsOptional()
    @Min(0)
    @Transform(({ value }: { value: string | number | undefined }) =>
        parseInt(String(value), 10),
    )
    display_order?: number;

    @IsArray()
    @IsOptional()
    @Transform(
        ({
            value,
        }: {
            value: string | number[] | undefined;
        }): number[] | undefined => {
            if (typeof value === 'string') {
                return value.split(',').map((v: string) => parseInt(v, 10));
            }
            return value;
        },
    )
    style_ids?: number[];

    @IsArray()
    @IsOptional()
    @Transform(
        ({
            value,
        }: {
            value: string | number[] | undefined;
        }): number[] | undefined => {
            if (typeof value === 'string') {
                return value.split(',').map((v: string) => parseInt(v, 10));
            }
            return value;
        },
    )
    size_ids?: number[];

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
