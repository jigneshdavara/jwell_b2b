import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BrandsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.brands.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.brands.count(),
        ]);

        return {
            items,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const brand = await this.prisma.brands.findUnique({
            where: { id: BigInt(id) },
        });
        if (!brand) {
            throw new NotFoundException('Brand not found');
        }
        return brand;
    }

    async create(dto: CreateBrandDto, coverImage?: string) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.brands.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.brands.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException('Brand with this name already exists');
        }
        if (existingByCode) {
            throw new ConflictException('Brand with this code already exists');
        }
        await this.prisma.brands.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
                cover_image: coverImage,
            },
        });
        return { success: true, message: 'Brand created successfully' };
    }

    async update(id: number, dto: UpdateBrandDto, coverImage?: string) {
        const brand = await this.findOne(id);

        // Check if trying to pause/deactivate brand that is assigned to products
        if (dto.is_active === false && brand.is_active === true) {
            const productsCount = await this.prisma.products.count({
                where: {
                    brand_id: BigInt(id),
                },
            });

            if (productsCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this brand. It is currently assigned to ${productsCount} product(s). Please remove the brand from all products first, then pause the brand.`,
                );
            }
        }

        if (dto.name && dto.name !== brand.name) {
            const existing = await this.prisma.brands.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new ConflictException(
                    'Brand with this name already exists',
                );
            }
        }

        if (dto.code && dto.code !== brand.code) {
            const existing = await this.prisma.brands.findUnique({
                where: { code: dto.code },
            });
            if (existing) {
                throw new ConflictException(
                    'Brand with this code already exists',
                );
            }
        }
        const updateData: {
            code?: string;
            name?: string;
            description?: string;
            is_active?: boolean;
            display_order?: number;
            cover_image?: string | null;
        } = {
            code: dto.code,
            name: dto.name,
            description: dto.description,
            is_active: dto.is_active,
            display_order: dto.display_order,
        };

        if (dto.remove_cover_image && brand.cover_image) {
            this.deleteImage(brand.cover_image);
            updateData.cover_image = null;
        } else if (coverImage) {
            if (brand.cover_image) {
                this.deleteImage(brand.cover_image);
            }
            updateData.cover_image = coverImage;
        }

        await this.prisma.brands.update({
            where: { id: BigInt(id) },
            data: updateData,
        });
        return { success: true, message: 'Brand updated successfully' };
    }

    async remove(id: number) {
        const brand = await this.findOne(id);

        // Check if brand is assigned to products
        const productsCount = await this.prisma.products.count({
            where: {
                brand_id: BigInt(id),
            },
        });

        if (productsCount > 0) {
            throw new BadRequestException(
                `Cannot delete this brand. It is currently assigned to ${productsCount} product(s). Please remove the brand from all products first, then delete the brand.`,
            );
        }

        if (brand.cover_image) {
            this.deleteImage(brand.cover_image);
        }
        await this.prisma.brands.delete({
            where: { id: BigInt(id) },
        });
        return { success: true, message: 'Brand deleted successfully' };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Check if any of the brands are assigned to products
        const brandsWithProducts = await this.prisma.products.findMany({
            where: {
                brand_id: { in: bigIntIds },
            },
            select: {
                brand_id: true,
            },
            distinct: ['brand_id'],
        });

        if (brandsWithProducts.length > 0) {
            const brandNames = await this.prisma.brands.findMany({
                where: {
                    id: { in: brandsWithProducts.map((p) => p.brand_id) },
                },
                select: {
                    name: true,
                },
            });
            const brandNamesList = brandNames.map((b) => b.name).join(', ');
            throw new BadRequestException(
                `Cannot delete brand(s): ${brandNamesList}. They are currently assigned to products. Please remove the brand(s) from all products first, then delete the brand(s).`,
            );
        }

        const brands = await this.prisma.brands.findMany({
            where: { id: { in: bigIntIds } },
            select: { cover_image: true },
        });

        for (const brand of brands) {
            if (brand.cover_image) {
                this.deleteImage(brand.cover_image);
            }
        }

        await this.prisma.brands.deleteMany({
            where: { id: { in: bigIntIds } },
        });
        return { success: true, message: 'Brands deleted successfully' };
    }

    private deleteImage(imagePath: string) {
        const fullPath = path.join(process.cwd(), 'public', imagePath);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
            } catch (err) {
                console.error(`Failed to delete image: ${fullPath}`, err);
            }
        }
    }
}
