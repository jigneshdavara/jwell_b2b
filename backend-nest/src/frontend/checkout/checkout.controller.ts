import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { FrontendCheckoutService } from './checkout.service';
import { ConfirmCheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';
import { CartService } from '../../cart/cart.service';

@Controller('checkout')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class FrontendCheckoutController {
    constructor(
        private checkoutService: FrontendCheckoutService,
        private cartService: CartService,
    ) {}

    @Get()
    async show(@Request() req: any) {
        const userId = BigInt(req.user.userId);
        const state = await this.checkoutService.initialize(userId);
        const paymentMeta = state.payment;

        return {
            order: {
                reference: state.order.reference,
                total: state.order.total,
                currency: state.order.currency,
                items: state.order.items,
            },
            payment: {
                publishableKey: paymentMeta.publishable_key,
                clientSecret: paymentMeta.client_secret,
                paymentId: paymentMeta.payment_id,
                providerReference: paymentMeta.provider_reference,
            },
            summary: {
                subtotal: state.subtotal,
                tax: state.tax,
                discount: state.discount,
                shipping: state.shipping,
                total: state.total,
                currency: state.currency,
            },
        };
    }

    @Get('orders/:orderId/pay')
    async payOrder(
        @Param('orderId', ParseIntPipe) orderId: number,
        @Request() req: any,
    ) {
        const orderIdBigInt = BigInt(orderId);
        const userId = BigInt(req.user.userId);

        try {
            const state = await this.checkoutService.initializeExistingOrder(
                orderIdBigInt,
                userId,
            );

            return {
                order: {
                    reference: state.order.reference,
                    total: state.order.total,
                    currency: state.order.currency,
                    items: state.order.items,
                },
                payment: {
                    publishableKey: state.payment.publishable_key,
                    clientSecret: state.payment.client_secret,
                    providerReference: state.payment.provider_reference,
                },
                summary: {
                    subtotal: state.subtotal,
                    tax: state.tax,
                    discount: state.discount,
                    shipping: state.shipping,
                    total: state.total,
                    currency: state.currency,
                },
            };
        } catch (error: any) {
            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }
            throw new BadRequestException(
                error.message || 'Failed to initialize order payment',
            );
        }
    }

    @Post('confirm')
    @HttpCode(HttpStatus.OK)
    async confirm(
        @Body() dto: ConfirmCheckoutDto,
        @Request() req: any,
    ) {
        const userId = BigInt(req.user.userId);

        try {
            const order = await this.checkoutService.finalize(
                dto.payment_intent_id,
                userId,
            );

            // Clear cart
            const cart = await this.cartService.getActiveCart(userId);
            await this.cartService.clear(cart);

            return {
                message: `Order ${order.reference} confirmed. Production planning is underway.`,
                order: {
                    id: order.id.toString(),
                    reference: order.reference,
                },
            };
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(
                error.message || 'Payment confirmation failed',
            );
        }
    }
}

