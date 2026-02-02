import {
    IsString,
    IsOptional,
    IsEmail,
    IsNotEmpty,
    MaxLength,
    IsEnum,
    IsInt,
    MinLength,
    ValidateIf,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    registerDecorator,
    ValidationOptions,
} from 'class-validator';

export enum AdminType {
    ADMIN = 'admin',
    SUPER_ADMIN = 'super-admin',
    PRODUCTION = 'production',
    SALES = 'sales',
}

@ValidatorConstraint({ name: 'MatchPassword', async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
    validate(passwordConfirmation: any, args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as any)[relatedPropertyName];
        return passwordConfirmation === relatedValue;
    }

    defaultMessage(args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        return `${args.property} must match ${relatedPropertyName}`;
    }
}

export function MatchPassword(
    property: string,
    validationOptions?: ValidationOptions,
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: MatchPasswordConstraint,
        });
    };
}

export class CreateAdminDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(191)
    name: string;

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(191)
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsString()
    @IsNotEmpty()
    @MatchPassword('password', {
        message: 'password_confirmation must match password',
    })
    password_confirmation: string;

    @IsEnum(AdminType)
    @IsOptional()
    type?: AdminType;

    @IsInt()
    @IsOptional()
    admin_group_id?: number;
}

export class UpdateAdminDto {
    @IsString()
    @IsOptional()
    @MaxLength(191)
    name?: string;

    @IsEmail()
    @IsOptional()
    @MaxLength(191)
    email?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o) => {
        const hasPassword =
            o.password !== undefined &&
            o.password !== null &&
            o.password !== '';
        return hasPassword;
    })
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password?: string;

    @IsString()
    @ValidateIf((o) => {
        const hasPassword =
            o.password !== undefined &&
            o.password !== null &&
            o.password !== '';
        return hasPassword;
    })
    @IsNotEmpty({
        message: 'password_confirmation is required when password is provided',
    })
    @MatchPassword('password', {
        message: 'password_confirmation must match password',
    })
    password_confirmation?: string;

    @IsEnum(AdminType)
    @IsOptional()
    type?: AdminType;

    @IsInt()
    @IsOptional()
    admin_group_id?: number;
}

export class UpdateAdminGroupDto {
    @IsInt()
    @IsOptional()
    admin_group_id?: number | null;
}

export class BulkDestroyDto {
    @IsInt({ each: true })
    ids: number[];
}
