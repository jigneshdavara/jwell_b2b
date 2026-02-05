import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import * as fs from 'fs';
import * as path from 'path';

export type TreeNode = {
    id: bigint;
    name: string;
    parent_id: bigint | null;
    children: TreeNode[];
};

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.categories.findMany({
                skip,
                take: perPage,
                include: {
                    categories: { select: { id: true, name: true } }, // Parent
                    category_styles: {
                        include: {
                            styles: {
                                select: {
                                    id: true,
                                    name: true,
                                    is_active: true,
                                },
                            },
                        },
                    },
                    category_sizes: {
                        include: {
                            sizes: {
                                select: {
                                    id: true,
                                    name: true,
                                    is_active: true,
                                },
                            },
                        },
                    },
                },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.categories.count(),
        ]);

        // Format items to match Laravel response
        const formattedItems = items.map((item) => ({
            ...item,
            parent: item.categories,
            styles: item.category_styles
                .map((cs) => cs.styles)
                .filter((style) => style.is_active === true),
            sizes: item.category_sizes
                .map((cs) => cs.sizes)
                .filter((size) => size.is_active === true),
            cover_image_url: item.cover_image
                ? item.cover_image.startsWith('storage/')
                    ? `/${item.cover_image}`
                    : `/storage/${item.cover_image}`
                : null,
            // Clean up internal prisma relation fields
            categories: undefined,
            category_styles: undefined,
            category_sizes: undefined,
        }));

        // Get all active categories for tree structure
        const allCategories = await this.prisma.categories.findMany({
            where: { is_active: true },
            orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            select: { id: true, name: true, parent_id: true },
        });

        const tree = this.buildTree(allCategories);
        const parentCategories = this.flattenTree(tree);

        // Get available styles and sizes for UI
        const [styles, sizes] = await Promise.all([
            this.prisma.styles.findMany({
                where: { is_active: true },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
                select: { id: true, name: true },
            }),
            this.prisma.sizes.findMany({
                where: { is_active: true },
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
                select: { id: true, name: true },
            }),
        ]);

        return {
            items: formattedItems,
            parentCategories,
            categoryTree: tree,
            styles,
            sizes,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const category = await this.prisma.categories.findUnique({
            where: { id: BigInt(id) },
            include: {
                categories: { select: { id: true, name: true } },
                category_styles: {
                    include: {
                        styles: {
                            select: { id: true, name: true, is_active: true },
                        },
                    },
                },
                category_sizes: {
                    include: {
                        sizes: {
                            select: { id: true, name: true, is_active: true },
                        },
                    },
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Get all active styles assigned to this category
        const activeStyles = category.category_styles
            .map((cs) => cs.styles)
            .filter((style) => style.is_active === true);

        // Check which styles are assigned to products in THIS category only
        const styleIds = activeStyles.map((style) => Number(style.id));
        const categoryId = BigInt(id);
        const productsInCategory = await this.prisma.products.findMany({
            where: {
                category_id: categoryId,
                is_active: true,
            },
            select: {
                style_ids: true,
            },
        });

        // Find style IDs that are assigned to products in THIS category
        const stylesAssignedToProducts = new Set<number>();
        productsInCategory.forEach((product) => {
            if (product.style_ids && Array.isArray(product.style_ids)) {
                const productStyleIds = product.style_ids as number[];
                styleIds.forEach((styleId) => {
                    if (productStyleIds.includes(styleId)) {
                        stylesAssignedToProducts.add(styleId);
                    }
                });
            }
        });

        // Get all active sizes assigned to this category
        const activeSizes = category.category_sizes
            .map((cs) => cs.sizes)
            .filter((size) => size.is_active === true);

        // Check which sizes are assigned to products in THIS category only (via product_variants)
        const sizeIds = activeSizes.map((size) => Number(size.id));
        const productVariants = await this.prisma.product_variants.findMany({
            where: {
                size_id: {
                    in: sizeIds.map((id) => BigInt(id)),
                },
                products: {
                    category_id: categoryId,
                    is_active: true,
                },
            },
            select: {
                size_id: true,
            },
        });

        // Find size IDs that are assigned to products in THIS category
        const sizesAssignedToProducts = new Set<number>();
        productVariants.forEach((variant) => {
            if (variant.size_id) {
                sizesAssignedToProducts.add(Number(variant.size_id));
            }
        });

        return {
            ...category,
            parent: category.categories,
            styles: activeStyles,
            styles_assigned_to_products: Array.from(stylesAssignedToProducts),
            sizes: activeSizes,
            sizes_assigned_to_products: Array.from(sizesAssignedToProducts),
            cover_image_url: category.cover_image
                ? category.cover_image.startsWith('storage/')
                    ? `/${category.cover_image}`
                    : `/storage/${category.cover_image}`
                : null,
            categories: undefined,
            category_styles: undefined,
            category_sizes: undefined,
        };
    }

    async create(dto: CreateCategoryDto, coverImage?: string) {
        const parentId = dto.parent_id ? BigInt(dto.parent_id) : null;

        // Check for duplicate category name within the same parent context
        const existingCategory = await this.prisma.categories.findFirst({
            where: {
                name: dto.name,
                parent_id: parentId,
            },
        });

        if (existingCategory) {
            if (parentId === null) {
                throw new ConflictException(
                    'A root category with this name already exists',
                );
            } else {
                throw new ConflictException(
                    'A category with this name already exists under the selected parent',
                );
            }
        }

        await this.prisma.$transaction(async (tx) => {
            const category = await tx.categories.create({
                data: {
                    parent_id: parentId,
                    code: dto.code,
                    name: dto.name,
                    description: dto.description,
                    is_active: dto.is_active ?? true,
                    display_order: dto.display_order ?? 0,
                    cover_image: coverImage,
                },
            });

            if (dto.style_ids?.length) {
                await tx.category_styles.createMany({
                    data: dto.style_ids.map((style_id) => ({
                        category_id: category.id,
                        style_id: BigInt(style_id),
                    })),
                });
            }

            if (dto.size_ids?.length) {
                await tx.category_sizes.createMany({
                    data: dto.size_ids.map((size_id) => ({
                        category_id: category.id,
                        size_id: BigInt(size_id),
                    })),
                });
            }

            return category;
        });
        return { success: true, message: 'Category created successfully' };
    }

    async update(id: number, dto: UpdateCategoryDto, coverImage?: string) {
        const categoryId = BigInt(id);
        const category = await this.prisma.categories.findUnique({
            where: { id: categoryId },
        });
        if (!category) throw new NotFoundException('Category not found');

        // Check if trying to pause/deactivate category that is assigned to products
        if (dto.is_active === false && category.is_active === true) {
            // Check if category is used as main category
            const productsAsMainCategory = await this.prisma.products.count({
                where: {
                    category_id: categoryId,
                },
            });

            // Check if category is used as subcategory (in JSON array)
            // Get all products and filter those with subcategory_ids containing this category
            const allProducts = await this.prisma.products.findMany({
                select: {
                    id: true,
                    subcategory_ids: true,
                },
            });

            // Filter products where this category ID is in the subcategory_ids array
            const categoryIdNumber = Number(id);
            const matchingSubcategoryProducts = allProducts.filter(
                (product) => {
                    if (!product.subcategory_ids) return false;
                    const subcategoryIds = product.subcategory_ids as number[];
                    return (
                        Array.isArray(subcategoryIds) &&
                        subcategoryIds.includes(categoryIdNumber)
                    );
                },
            );

            const totalProductsCount =
                productsAsMainCategory + matchingSubcategoryProducts.length;

            if (totalProductsCount > 0) {
                throw new BadRequestException(
                    `Cannot pause this category. It is currently assigned to ${totalProductsCount} product(s) ${productsAsMainCategory > 0 && matchingSubcategoryProducts.length > 0 ? '(as main category and/or subcategory)' : productsAsMainCategory > 0 ? '(as main category)' : '(as subcategory)'}. Please remove the category from all products first, then pause the category.`,
                );
            }
        }

        // Determine the parent_id that will be used (either from dto or existing)
        const newParentId =
            dto.parent_id !== undefined
                ? dto.parent_id
                    ? BigInt(dto.parent_id)
                    : null
                : category.parent_id;

        // Check for duplicate category name if name or parent_id is being changed
        if (dto.name !== undefined || dto.parent_id !== undefined) {
            const nameToCheck = dto.name ?? category.name;
            const nameChanged =
                dto.name !== undefined && dto.name !== category.name;
            const parentChanged =
                dto.parent_id !== undefined &&
                newParentId?.toString() !== category.parent_id?.toString();

            // Only check for duplicates if name or parent changed
            if (nameChanged || parentChanged) {
                const existingCategory = await this.prisma.categories.findFirst(
                    {
                        where: {
                            name: nameToCheck,
                            parent_id: newParentId,
                            id: { not: categoryId }, // Exclude current category
                        },
                    },
                );

                if (existingCategory) {
                    if (newParentId === null) {
                        throw new ConflictException(
                            'A root category with this name already exists',
                        );
                    } else {
                        throw new ConflictException(
                            'A category with this name already exists under the selected parent',
                        );
                    }
                }
            }
        }

        const updateData: {
            parent_id?: bigint | null;
            code?: string;
            name?: string;
            description?: string | null;
            is_active?: boolean;
            display_order?: number;
            cover_image?: string | null;
        } = {};

        if (dto.parent_id !== undefined) {
            updateData.parent_id = dto.parent_id ? BigInt(dto.parent_id) : null;
        }
        if (dto.code !== undefined) {
            updateData.code = dto.code;
        }
        if (dto.name !== undefined) {
            updateData.name = dto.name;
        }
        if (dto.description !== undefined) {
            updateData.description = dto.description;
        }
        if (dto.is_active !== undefined) {
            updateData.is_active = dto.is_active;
        }
        if (dto.display_order !== undefined) {
            updateData.display_order = dto.display_order;
        }

        if (dto.remove_cover_image && category.cover_image) {
            // Remove image: delete from storage and set to null in database
            this.deleteImage(category.cover_image);
            updateData.cover_image = null;
        } else if (coverImage) {
            // New image uploaded: delete old one (if exists) and set new path
            if (category.cover_image) {
                this.deleteImage(category.cover_image);
            }
            updateData.cover_image = coverImage;
        }
        // If no new image and not removing, cover_image is not included in updateData
        // This preserves the existing image in the database

        await this.prisma.$transaction(async (tx) => {
            const updatedCategory = await tx.categories.update({
                where: { id: categoryId },
                data: updateData,
            });

            if (dto.style_ids !== undefined) {
                await tx.category_styles.deleteMany({
                    where: { category_id: categoryId },
                });
                if (dto.style_ids.length) {
                    await tx.category_styles.createMany({
                        data: dto.style_ids.map((style_id) => ({
                            category_id: categoryId,
                            style_id: BigInt(style_id),
                        })),
                    });
                }
            }

            if (dto.size_ids !== undefined) {
                await tx.category_sizes.deleteMany({
                    where: { category_id: categoryId },
                });
                if (dto.size_ids.length) {
                    await tx.category_sizes.createMany({
                        data: dto.size_ids.map((size_id) => ({
                            category_id: categoryId,
                            size_id: BigInt(size_id),
                        })),
                    });
                }
            }

            return updatedCategory;
        });

        return { success: true, message: 'Category updated successfully' };
    }

    async remove(id: number) {
        const categoryId = BigInt(id);
        const category = await this.prisma.categories.findUnique({
            where: { id: categoryId },
        });
        if (!category) throw new NotFoundException('Category not found');

        // Get category and all its subcategories (recursively)
        const idsToDelete = await this.getCategoryAndDescendantIds(categoryId);

        // Check if any of these categories have products (main or subcategory)
        const { hasProducts, productCount } =
            await this.checkCategoriesHaveProducts(idsToDelete);

        if (hasProducts) {
            throw new BadRequestException(
                `Cannot delete this category. It or its subcategories are currently assigned to ${productCount} product(s). Please remove the category from all products first, then delete the category.`,
            );
        }

        // Delete recursively: subcategories first, then parent
        const deletedCount = await this.deleteCategoryRecursive(categoryId);
        return {
            success: true,
            message:
                deletedCount > 1
                    ? `Category and ${deletedCount - 1} subcategor${deletedCount - 1 === 1 ? 'y' : 'ies'} removed successfully`
                    : 'Category removed successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        const selectedSet = new Set(bigIntIds.map((id) => id.toString()));

        // Get category data to find "roots" (selected categories whose parent is not selected)
        const categories = await this.prisma.categories.findMany({
            where: { id: { in: bigIntIds } },
            select: { id: true, parent_id: true },
        });

        const roots = categories.filter(
            (c) =>
                !c.parent_id ||
                !selectedSet.has(c.parent_id.toString()),
        );

        const conflictingCategoryIds: bigint[] = [];
        const rootsToDelete: bigint[] = [];

        for (const root of roots) {
            const subtreeIds = await this.getCategoryAndDescendantIds(root.id);
            const { hasProducts } =
                await this.checkCategoriesHaveProducts(subtreeIds);
            if (hasProducts) {
                conflictingCategoryIds.push(...subtreeIds);
            } else {
                rootsToDelete.push(root.id);
            }
        }

        // Deduplicate conflicting IDs
        const conflictingSet = new Set(
            conflictingCategoryIds.map((id) => id.toString()),
        );
        const uniqueConflictingIds = Array.from(conflictingSet).map((s) =>
            BigInt(s),
        );

        let deletedCount = 0;
        for (const rootId of rootsToDelete) {
            const category = await this.prisma.categories.findUnique({
                where: { id: rootId },
            });
            if (category) {
                deletedCount += await this.deleteCategoryRecursive(rootId);
            }
        }

        if (uniqueConflictingIds.length === 0) {
            return {
                success: true,
                message: `${deletedCount} categor${deletedCount === 1 ? 'y' : 'ies'} removed successfully`,
            };
        }

        const categoryDetails = await Promise.all(
            uniqueConflictingIds.map(async (categoryId) => {
                const categoryData = await this.prisma.categories.findUnique({
                    where: { id: categoryId },
                    select: { name: true },
                });
                const { productCount } =
                    await this.checkCategoriesHaveProducts([categoryId]);
                return {
                    id: categoryId,
                    name: categoryData?.name || 'Unknown',
                    productsCount: productCount,
                };
            }),
        );

        const conflicts = categoryDetails.map(
            (detail) =>
                `${detail.name} (assigned to ${detail.productsCount} product${detail.productsCount === 1 ? '' : 's'})`,
        );

        if (deletedCount > 0) {
            return {
                success: true,
                message: `${deletedCount} categor${deletedCount === 1 ? 'y' : 'ies'} removed successfully. Cannot delete: ${conflicts.join(', ')}. Please remove them from all products first.`,
            };
        }
        throw new BadRequestException(
            `Cannot delete category(ies): ${conflicts.join(', ')}. They are currently assigned to products. Please remove the category(ies) from all products first, then delete the category(ies).`,
        );
    }

    private buildTree(
        nodes: Array<{ id: bigint; name: string; parent_id: bigint | null }>,
    ): TreeNode[] {
        const map: Record<string, TreeNode> = {};
        const tree: TreeNode[] = [];

        nodes.forEach((node) => {
            map[node.id.toString()] = { ...node, children: [] };
        });

        nodes.forEach((node) => {
            if (node.parent_id !== null) {
                const parent = map[node.parent_id.toString()];
                if (parent) {
                    parent.children.push(map[node.id.toString()]);
                } else {
                    tree.push(map[node.id.toString()]);
                }
            } else {
                tree.push(map[node.id.toString()]);
            }
        });

        return tree;
    }

    private flattenTree(
        tree: TreeNode[],
        level = 0,
    ): Array<{ id: bigint; name: string; level: number }> {
        let result: Array<{ id: bigint; name: string; level: number }> = [];
        const prefix = level > 0 ? '  '.repeat(level) + '└─ ' : '';

        tree.forEach((node) => {
            result.push({
                id: node.id,
                name: prefix + node.name,
                level,
            });
            if (node.children.length) {
                result = result.concat(
                    this.flattenTree(node.children, level + 1),
                );
            }
        });

        return result;
    }

    /** Get category ID and all descendant (subcategory) IDs recursively */
    private async getCategoryAndDescendantIds(categoryId: bigint): Promise<bigint[]> {
        const children = await this.prisma.categories.findMany({
            where: { parent_id: categoryId },
            select: { id: true },
        });
        const ids: bigint[] = [categoryId];
        for (const child of children) {
            const descendantIds = await this.getCategoryAndDescendantIds(child.id);
            ids.push(...descendantIds);
        }
        return ids;
    }

    /** Check if any of the given categories have products (as main or subcategory) */
    private async checkCategoriesHaveProducts(
        categoryIds: bigint[],
    ): Promise<{ hasProducts: boolean; productCount: number }> {
        const categoryIdsNumbers = categoryIds.map((id) => Number(id));

        const productsAsMainCategory = await this.prisma.products.count({
            where: { category_id: { in: categoryIds } },
        });

        const allProducts = await this.prisma.products.findMany({
            select: { subcategory_ids: true },
        });
        const matchingSubcategoryProducts = allProducts.filter((product) => {
            if (!product.subcategory_ids) return false;
            const subcategoryIds = product.subcategory_ids as number[];
            return (
                Array.isArray(subcategoryIds) &&
                subcategoryIds.some((sid) => categoryIdsNumbers.includes(sid))
            );
        });

        const productCount =
            productsAsMainCategory + matchingSubcategoryProducts.length;
        return {
            hasProducts: productCount > 0,
            productCount,
        };
    }

    /** Delete category and all its subcategories recursively (children first, then self) */
    private async deleteCategoryRecursive(categoryId: bigint): Promise<number> {
        const children = await this.prisma.categories.findMany({
            where: { parent_id: categoryId },
            select: { id: true, cover_image: true },
        });
        let count = 0;
        for (const child of children) {
            count += await this.deleteCategoryRecursive(child.id);
        }
        const category = await this.prisma.categories.findUnique({
            where: { id: categoryId },
            select: { cover_image: true },
        });
        if (category?.cover_image) {
            this.deleteImage(category.cover_image);
        }
        await this.prisma.categories.delete({
            where: { id: categoryId },
        });
        return count + 1;
    }

    private deleteImage(imagePath: string) {
        // Handle paths that already include 'storage/' prefix
        const pathToUse = imagePath.startsWith('storage/')
            ? imagePath
            : `storage/${imagePath}`;
        const fullPath = path.join(process.cwd(), 'public', pathToUse);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
            } catch (err) {
                console.error(
                    `Failed to delete category image: ${fullPath}`,
                    err,
                );
            }
        }
    }
}
