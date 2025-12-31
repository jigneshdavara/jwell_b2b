import {
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
                            styles: { select: { id: true, name: true } },
                        },
                    },
                    category_sizes: {
                        include: {
                            sizes: { select: { id: true, name: true } },
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
            styles: item.category_styles.map((cs) => cs.styles),
            sizes: item.category_sizes.map((cs) => cs.sizes),
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
                    include: { styles: { select: { id: true, name: true } } },
                },
                category_sizes: {
                    include: { sizes: { select: { id: true, name: true } } },
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return {
            ...category,
            parent: category.categories,
            styles: category.category_styles.map((cs) => cs.styles),
            sizes: category.category_sizes.map((cs) => cs.sizes),
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

        if (category.cover_image) {
            this.deleteImage(category.cover_image);
        }

        await this.prisma.categories.delete({
            where: { id: categoryId },
        });
        return { success: true, message: 'Category removed successfully' };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        const categories = await this.prisma.categories.findMany({
            where: { id: { in: bigIntIds } },
            select: { cover_image: true },
        });

        for (const category of categories) {
            if (category.cover_image) {
                this.deleteImage(category.cover_image);
            }
        }

        await this.prisma.categories.deleteMany({
            where: { id: { in: bigIntIds } },
        });
        return { success: true, message: 'Categories removed successfully' };
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
