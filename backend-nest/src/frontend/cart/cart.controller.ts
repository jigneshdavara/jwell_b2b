import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ParseIntPipe,
} from '@nestjs/common';
import { CartService } from '../../cart/cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('cart')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class FrontendCartController {
    constructor(
        private readonly cartService: CartService,
        private readonly prisma: PrismaService,
    ) {}

    @Get()
    async index(@Request() req) {
        const userId = BigInt(req.user.userId);
        const summary = await this.cartService.summarize(userId);

        return {
            cart: {
                items: summary.items,
                currency: summary.currency,
                subtotal: summary.subtotal,
                tax: summary.tax,
                discount: summary.discount,
                shipping: summary.shipping,
                total: summary.total,
            },
        };
    }

    @Post('items')
    async store(@Request() req, @Body() dto: AddCartItemDto) {
        const userId = BigInt(req.user.userId);

        // Verify product exists
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(dto.product_id) },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Verify variant exists if provided
        let variantId: bigint | null = null;
        if (dto.product_variant_id) {
            const variant = await this.prisma.product_variants.findFirst({
                where: {
                    id: BigInt(dto.product_variant_id),
                    product_id: BigInt(dto.product_id),
                },
            });

            if (!variant) {
                throw new NotFoundException(
                    'Selected variant is no longer available.',
                );
            }

            variantId = variant.id;
        }

        const quantity = dto.quantity || 1;
        const configuration = dto.configuration || {};

        await this.cartService.addItem(
            userId,
            BigInt(dto.product_id),
            variantId,
            quantity,
            configuration,
        );

        // Get variant label for response message
        let variantLabel = '';
        if (variantId) {
            const variant = await this.prisma.product_variants.findUnique({
                where: { id: variantId },
            });
            if (variant) {
                variantLabel = ' · ' + variant.label;
            }
        }

        return {
            message: `${product.name}${variantLabel} added to your quotation list.`,
        };
    }

    @Patch('items/:id')
    async update(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCartItemDto,
    ) {
        const userId = BigInt(req.user.userId);
        const itemId = BigInt(id);

        // Verify ownership
        await this.authorizeCartItem(userId, itemId);

        const item = await this.prisma.cart_items.findUnique({
            where: { id: itemId },
            include: {
                product_variants: true,
            },
        });

        if (!item) {
            throw new NotFoundException('Cart item not found');
        }

        // Handle quantity update
        if (dto.quantity !== undefined && dto.quantity !== null) {
            const quantity = dto.quantity;
            const currentQuantity = item.quantity;
            const isDecreasing = quantity < currentQuantity;

            // Validate inventory quantity if variant exists
            if (item.product_variant_id && item.product_variants) {
                // Reload variant to get latest inventory
                const variant = await this.prisma.product_variants.findUnique({
                    where: { id: item.product_variant_id },
                });

                if (variant && variant.inventory_quantity !== null) {
                    const inventoryQuantity = Number(variant.inventory_quantity);

                    // If inventory is tracked and is 0, reject the update
                    if (inventoryQuantity === 0) {
                        throw new BadRequestException(
                            'This product variant is currently out of stock.',
                        );
                    }

                    // Only prevent exceeding inventory when increasing (not when decreasing)
                    // Allow decreasing even if new quantity still exceeds inventory
                    if (!isDecreasing && quantity > inventoryQuantity) {
                        const itemWord =
                            inventoryQuantity === 1 ? 'item' : 'items';
                        const isWord =
                            inventoryQuantity === 1 ? 'item is' : 'items are';
                        throw new BadRequestException(
                            `Only ${inventoryQuantity} ${isWord} available. Maximum ${inventoryQuantity} ${itemWord} allowed.`,
                        );
                    }
                }
            }

            await this.cartService.updateItemQuantity(itemId, quantity);
        }

        // Handle configuration update
        if (dto.configuration !== undefined && dto.configuration !== null) {
            await this.cartService.updateItemConfiguration(
                itemId,
                dto.configuration,
            );
        }

        return { message: 'Updated quotation entry.' };
    }

    @Delete('items/:id')
    async destroy(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ) {
        const userId = BigInt(req.user.userId);
        const itemId = BigInt(id);

        // Verify ownership
        await this.authorizeCartItem(userId, itemId);

        await this.cartService.removeItem(itemId);

        return { message: 'Removed from your purchase list.' };
    }

    private async authorizeCartItem(userId: bigint, itemId: bigint) {
        const item = await this.prisma.cart_items.findUnique({
            where: { id: itemId },
            include: {
                carts: true,
            },
        });

        if (!item) {
            throw new NotFoundException('Cart item not found');
        }

        if (item.carts.user_id.toString() !== userId.toString()) {
            throw new ForbiddenException(
                'You do not have permission to modify this item',
            );
        }
    }
}

