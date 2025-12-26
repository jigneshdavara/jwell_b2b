import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';

@Injectable()
export class NavigationService {
    constructor(private prisma: PrismaService) {}

    async getNavigation() {
        const [categories, brands, catalogs] = await Promise.all([
            // Categories - limit to 8, include cover_image, only parent categories (parent_id is null)
            this.prisma.categories.findMany({
                where: {
                    is_active: true,
                    parent_id: null, // Only show parent categories in navbar
                },
                select: {
                    id: true,
                    name: true,
                    cover_image: true,
                },
                orderBy: { name: 'asc' },
                take: 8,
            }),

            // Brands - limit to 8
            this.prisma.brands.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: 'asc' },
                take: 8,
            }),

            // Catalogs - limit to 8
            this.prisma.catalogs.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: 'asc' },
                take: 8,
            }),
        ]);

        // Helper to resolve image URL
        const resolveImageUrl = (
            coverImage: string | null | undefined,
        ): string | null => {
            if (!coverImage) {
                return null;
            }

            // If already absolute URL, return as-is
            if (
                coverImage.startsWith('http://') ||
                coverImage.startsWith('https://')
            ) {
                return coverImage;
            }

            // If starts with /storage/, return as-is (will be served from static assets)
            if (coverImage.startsWith('/storage/')) {
                return coverImage;
            }

            // Otherwise, prepend /storage/
            return `/storage/${coverImage}`;
        };

        return {
            categories: categories.map((category) => ({
                id: Number(category.id),
                name: category.name,
                cover_image_url: resolveImageUrl(category.cover_image),
            })),
            brands: brands.map((brand) => ({
                id: Number(brand.id),
                name: brand.name,
            })),
            catalogs: catalogs.map((catalog) => ({
                id: Number(catalog.id),
                name: catalog.name,
            })),
        };
    }
}
