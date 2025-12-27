import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    IsEnum,
    Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UserFilterDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsInt()
    @Transform(({ value }) => parseInt(value))
    user_group_id?: number;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    only_active?: boolean;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    per_page?: number = 10;
}

export class UpdateUserStatusDto {
    @IsString()
    kyc_status: string;

    @IsOptional()
    @IsString()
    kyc_notes?: string;
}

export class BulkDeleteUsersDto {
    @IsInt({ each: true })
    ids: number[];
}

export class BulkGroupUpdateDto {
    @IsInt({ each: true })
    ids: number[];

    @IsOptional()
    @IsInt()
    @Transform(({ value }) => (value ? parseInt(value) : null))
    user_group_id?: number | null;
}
