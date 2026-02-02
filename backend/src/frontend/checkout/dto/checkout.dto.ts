import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmCheckoutDto {
    @IsNotEmpty()
    @IsString()
    payment_intent_id: string;
}
