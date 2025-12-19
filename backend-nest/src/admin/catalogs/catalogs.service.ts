import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCatalogDto, UpdateCatalogDto } from './dto/catalog.dto';

@Injectable()
export class CatalogsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.catalogs.findMany({
                skip,
                take: perPage,
                include: {
                    _count: {
                        select: { catalog_products: true },
                    },
                    catalog_products: {
                        select: { product_id: true },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.catalogs.count(),
        ]);

        const formattedItems = items.map((catalog) => ({
            id: catalog.id,
            code: catalog.code,
            name: catalog.name,
            description: catalog.description,
            is_active: catalog.is_active,
            display_order: catalog.display_order,
            products_count: catalog._count.catalog_products,
            product_ids: catalog.catalog_products.map((cp) => cp.product_id),
        }));

        return {
            items: formattedItems,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const catalog = await this.prisma.catalogs.findUnique({
            where: { id: BigInt(id) },
            include: {
                catalog_products: {
                    select: { product_id: true },
                },
            },
        });

        if (!catalog) {
            throw new NotFoundException('Catalog not found');
        }

        return {
            id: catalog.id,
            code: catalog.code,
            name: catalog.name,
            description: catalog.description,
            is_active: catalog.is_active,
            display_order: catalog.display_order,
            product_ids: catalog.catalog_products.map((cp) => cp.product_id),
        };
    }

    async create(dto: CreateCatalogDto) {
        return await this.prisma.catalogs.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    async update(id: number, dto: UpdateCatalogDto) {
        await this.findOne(id);
        return await this.prisma.catalogs.update({
            where: { id: BigInt(id) },
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
                updated_at: new Date(),
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return await this.prisma.catalogs.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkDestroy(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.catalogs.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }

    async getProductsForAssignment(id: number, search?: string) {
        const catalog = await this.findOne(id);
        const selectedProductIds = catalog.product_ids.map((id) =>
            id.toString(),
        );

        const products = await this.prisma.products.findMany({
            where: search
                ? {
                      OR: [
                          { name: { contains: search, mode: 'insensitive' } },
                          { sku: { contains: search, mode: 'insensitive' } },
                      ],
                  }
                : {},
            select: { id: true, name: true, sku: true },
            orderBy: { name: 'asc' },
        });

        return {
            catalog: {
                id: catalog.id,
                name: catalog.name,
            },
            products: products.map((product) => ({
                id: product.id,
                name: product.name,
                sku: product.sku,
                selected: selectedProductIds.includes(product.id.toString()),
            })),
            selectedProductIds: catalog.product_ids,
        };
    }

    async assignProducts(id: number, productIds: number[]) {
        const catalogId = BigInt(id);
        await this.findOne(id);

        return await this.prisma.$transaction(async (tx) => {
            // Delete existing assignments
            await tx.catalog_products.deleteMany({
                where: { catalog_id: catalogId },
            });

            // Create new assignments
            if (productIds.length > 0) {
                await tx.catalog_products.createMany({
                    data: productIds.map((productId) => ({
                        catalog_id: catalogId,
                        product_id: BigInt(productId),
                        created_at: new Date(),
                        updated_at: new Date(),
                    })),
                });
            }

            return { message: 'Catalog products updated successfully' };
        });
    }
}
