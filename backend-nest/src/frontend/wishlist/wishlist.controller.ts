import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    NotFoundException,
    ParseIntPipe,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddWishlistItemDto, MoveToCartDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('wishlist')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class WishlistController {
    constructor(
        private readonly wishlistService: WishlistService,
        private readonly prisma: PrismaService,
    ) {}

    @Get()
    async index(@Request() req) {
        const userId = BigInt(req.user.userId);
        const items = await this.wishlistService.getWishlistItems(userId);
        return { items };
    }

    @Post('items')
    @HttpCode(HttpStatus.CREATED)
    async store(@Request() req, @Body() dto: AddWishlistItemDto) {
        const userId = BigInt(req.user.userId);
        
        // Verify product exists
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(dto.product_id) },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Verify variant exists if provided
        if (dto.product_variant_id) {
            const variant = await this.prisma.product_variants.findUnique({
                where: { id: BigInt(dto.product_variant_id) },
            });

            if (!variant || variant.product_id.toString() !== dto.product_id.toString()) {
                throw new NotFoundException('Product variant not found');
            }
        }

        await this.wishlistService.addItem(
            userId,
            BigInt(dto.product_id),
            dto.product_variant_id ? BigInt(dto.product_variant_id) : undefined,
            dto.configuration,
        );

        return { message: 'Saved to your wishlist.' };
    }

    @Delete('items/:id')
    @HttpCode(HttpStatus.OK)
    async destroy(@Request() req, @Param('id', ParseIntPipe) id: number) {
        const userId = BigInt(req.user.userId);
        await this.wishlistService.removeItem(userId, BigInt(id));
        return { message: 'Removed from wishlist.' };
    }

    @Post('items/:id/move-to-cart')
    @HttpCode(HttpStatus.OK)
    async moveToCart(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: MoveToCartDto,
    ) {
        const userId = BigInt(req.user.userId);
        const quantity = dto.quantity || 1;
        await this.wishlistService.moveToCart(userId, BigInt(id), quantity);
        return { message: 'Moved to your quotation list.' };
    }

    @Delete('product/:id')
    @HttpCode(HttpStatus.OK)
    async destroyByProduct(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() body?: { product_variant_id?: number },
    ) {
        const userId = BigInt(req.user.userId);
        
        // Verify product exists
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(id) },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        await this.wishlistService.removeByProduct(
            userId,
            BigInt(id),
            body?.product_variant_id ? BigInt(body.product_variant_id) : undefined,
        );

        return { message: 'Removed from wishlist.' };
    }
}

