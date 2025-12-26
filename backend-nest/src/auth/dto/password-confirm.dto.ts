import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ConfirmPasswordDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}



