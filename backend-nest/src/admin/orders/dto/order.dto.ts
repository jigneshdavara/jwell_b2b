import {
    IsString,
    IsOptional,
    IsArray,
    IsObject,
    IsEnum,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Order status enum values (matching Laravel's OrderStatus enum)
export enum OrderStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    IN_PRODUCTION = 'in_production',
    QUALITY_CHECK = 'quality_check',
    READY_TO_DISPATCH = 'ready_to_dispatch',
    DISPATCHED = 'dispatched',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    PENDING_PAYMENT = 'pending_payment',
    PAID = 'paid',
    PAYMENT_FAILED = 'payment_failed',
    AWAITING_MATERIALS = 'awaiting_materials',
}

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsObject()
    @IsOptional()
    meta?: Record<string, any>;
}

export class UpdateOrderStatusMetaDto {
    @IsString()
    @IsOptional()
    comment?: string;
}
