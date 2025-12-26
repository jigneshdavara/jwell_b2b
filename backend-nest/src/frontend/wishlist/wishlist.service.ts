import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../../cart/cart.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WishlistService {
    constructor(
        private prisma: PrismaService,
        private cartService: CartService,
    ) {}

    async getWishlist(userId: bigint) {
        let wishlist = await this.prisma.wishlists.findUnique({
            where: { customer_id: userId },
            include: {
                wishlist_items: {
                    include: {
                        products: {
                            include: {
                                product_medias: {
                                    orderBy: { display_order: 'asc' },
                                },
                            },
                        },
                        product_variants: true,
                    },
                },
            },
        });

        if (!wishlist) {
            wishlist = await this.prisma.wishlists.create({
                data: {
                    customer_id: userId,
                    name: 'Primary',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                include: {
                    wishlist_items: {
                        include: {
                            products: {
                                include: {
                                    product_medias: {
                                        orderBy: { display_order: 'asc' },
                                    },
                                },
                            },
                            product_variants: true,
                        },
                    },
                },
            });
        }

        return wishlist;
    }

    async addItem(
        userId: bigint,
        productId: bigint,
        variantId?: bigint,
        configuration?: Record<string, any>,
    ) {
        const wishlist = await this.getWishlist(userId);

        // Check if item already exists
        const existing = await this.prisma.wishlist_items.findFirst({
            where: {
                wishlist_id: wishlist.id,
                product_id: productId,
                product_variant_id: variantId || null,
            },
        });

        if (existing) {
            // Return existing wishlist
            return this.getWishlist(userId);
        }

        // Create new wishlist item
        await this.prisma.wishlist_items.create({
            data: {
                wishlist_id: wishlist.id,
                product_id: productId,
                product_variant_id: variantId || null,
                configuration: configuration ? configuration : Prisma.JsonNull,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return this.getWishlist(userId);
    }

    async removeItem(userId: bigint, itemId: bigint) {
        // Verify ownership
        const item = await this.prisma.wishlist_items.findUnique({
            where: { id: itemId },
            include: {
                wishlists: true,
            },
        });

        if (!item) {
            throw new NotFoundException('Wishlist item not found');
        }

        if (item.wishlists.customer_id.toString() !== userId.toString()) {
            throw new ForbiddenException(
                'You do not have permission to remove this item',
            );
        }

        await this.prisma.wishlist_items.delete({
            where: { id: itemId },
        });
    }

    async removeByProduct(
        userId: bigint,
        productId: bigint,
        variantId?: bigint,
    ) {
        const wishlist = await this.getWishlist(userId);

        await this.prisma.wishlist_items.deleteMany({
            where: {
                wishlist_id: wishlist.id,
                product_id: productId,
                product_variant_id: variantId || null,
            },
        });
    }

    async moveToCart(userId: bigint, itemId: bigint, quantity: number = 1) {
        // Get wishlist item with product
        const item = await this.prisma.wishlist_items.findUnique({
            where: { id: itemId },
            include: {
                wishlists: true,
                products: true,
                product_variants: true,
            },
        });

        if (!item) {
            throw new NotFoundException('Wishlist item not found');
        }

        // Verify ownership
        if (item.wishlists.customer_id.toString() !== userId.toString()) {
            throw new ForbiddenException(
                'You do not have permission to move this item',
            );
        }

        // Check if product exists
        if (!item.products) {
            // Product was deleted, remove from wishlist
            await this.removeItem(userId, itemId);
            throw new NotFoundException('Product is no longer available');
        }

        // Add to cart using CartService
        const cart = await this.cartService.getActiveCart(userId);

        // Check if item already exists in cart with same configuration
        const existingCartItem = await this.prisma.cart_items.findFirst({
            where: {
                cart_id: cart.id,
                product_id: item.product_id,
                product_variant_id: item.product_variant_id || null,
            },
        });

        if (existingCartItem) {
            // Update quantity
            await this.prisma.cart_items.update({
                where: { id: existingCartItem.id },
                data: {
                    quantity: existingCartItem.quantity + quantity,
                    updated_at: new Date(),
                },
            });
        } else {
            // Create new cart item
            await this.prisma.cart_items.create({
                data: {
                    cart_id: cart.id,
                    product_id: item.product_id,
                    product_variant_id: item.product_variant_id || null,
                    quantity: quantity,
                    configuration: item.configuration
                        ? item.configuration
                        : Prisma.JsonNull,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }

        // Remove from wishlist
        await this.removeItem(userId, itemId);
    }

    async getWishlistItems(userId: bigint) {
        const wishlist = await this.getWishlist(userId);

        const items = wishlist.wishlist_items
            .filter((item) => item.products !== null)
            .map((item) => {
                const product = item.products as any;
                const variant = item.product_variants as any;
                const firstMedia = product.product_medias?.[0];

                let thumbnail: string | null = null;
                if (firstMedia && firstMedia.url) {
                    let mediaUrl = String(firstMedia.url);

                    // Normalize double slashes (except after http:// or https://)
                    // This handles cases where URL might be /storage//storage/path
                    mediaUrl = mediaUrl.replace(/(?<!:)\/{2,}/g, '/');

                    if (
                        mediaUrl.startsWith('http://') ||
                        mediaUrl.startsWith('https://')
                    ) {
                        thumbnail = mediaUrl;
                    } else if (mediaUrl.startsWith('/storage/')) {
                        // URL already has /storage/ prefix, use as-is (normalized)
                        thumbnail = mediaUrl;
                    } else {
                        // URL is relative, add /storage/ prefix
                        // Remove leading slash if present to avoid double slashes
                        const cleanUrl = mediaUrl.startsWith('/')
                            ? mediaUrl.substring(1)
                            : mediaUrl;
                        thumbnail = `/storage/${cleanUrl}`;
                    }
                }

                return {
                    id: item.id.toString(),
                    product_id: item.product_id.toString(),
                    variant_id: item.product_variant_id?.toString() || null,
                    sku: product.sku || null,
                    name: product.name || null,
                    thumbnail,
                    variant_label: variant?.label || null,
                    configuration: item.configuration
                        ? item.configuration
                        : Prisma.JsonNull,
                };
            })
            .filter((item) => item.name !== null);

        return items;
    }
}
