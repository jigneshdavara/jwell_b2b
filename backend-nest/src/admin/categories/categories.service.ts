import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
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
            categories: undefined,
            category_styles: undefined,
            category_sizes: undefined,
        };
    }

    async create(dto: CreateCategoryDto, coverImage?: string) {
        return await this.prisma.$transaction(async (tx) => {
            const category = await tx.categories.create({
                data: {
                    parent_id: dto.parent_id ? BigInt(dto.parent_id) : null,
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
      }

      return category;
    });
  }

  async update(id: number, dto: UpdateCategoryDto, coverImage?: string) {
    const categoryId = BigInt(id);
    const category = await this.prisma.categories.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    let imageToUpdate: string | undefined = coverImage;
    if (dto.remove_cover_image && category.cover_image) {
      this.deleteImage(category.cover_image);
      imageToUpdate = undefined;
    } else if (coverImage && category.cover_image) {
      this.deleteImage(category.cover_image);
    } else if (!coverImage) {
      imageToUpdate = category.cover_image ?? undefined;
    }

    async update(id: number, dto: UpdateCategoryDto, coverImage?: string) {
        const categoryId = BigInt(id);
        const category = await this.prisma.categories.findUnique({
            where: { id: categoryId },
        });
        if (!category) throw new NotFoundException('Category not found');

        let imageToUpdate = coverImage;
        if (dto.remove_cover_image && category.cover_image) {
            this.deleteImage(category.cover_image);
            imageToUpdate = null;
        } else if (coverImage && category.cover_image) {
            this.deleteImage(category.cover_image);
        } else if (!coverImage) {
            imageToUpdate = category.cover_image;
        }

        return await this.prisma.$transaction(async (tx) => {
            const updatedCategory = await tx.categories.update({
                where: { id: categoryId },
                data: {
                    parent_id:
                        dto.parent_id !== undefined
                            ? dto.parent_id
                                ? BigInt(dto.parent_id)
                                : null
                            : undefined,
                    code: dto.code,
                    name: dto.name,
                    description: dto.description,
                    is_active: dto.is_active,
                    display_order: dto.display_order,
                    cover_image: imageToUpdate,
                },
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

        // Prisma onDelete: Cascade should handle pivot tables
        return await this.prisma.categories.delete({
            where: { id: categoryId },
        });
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

        return await this.prisma.categories.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }

    private buildTree(nodes: any[]): any[] {
        const map = {};
        const tree = [];

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

    private flattenTree(tree: any[], level = 0): any[] {
        let result = [];
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

    return await this.prisma.categories.deleteMany({
      where: { id: { in: bigIntIds } },
    });
  }

  private buildTree(nodes: any[]): any[] {
    const map: Record<string, any> = {};
    const tree: any[] = [];

    nodes.forEach(node => {
      map[node.id.toString()] = { ...node, children: [] };
    });

    nodes.forEach(node => {
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

  private flattenTree(tree: any[], level = 0): any[] {
    let result: any[] = [];
    const prefix = level > 0 ? '  '.repeat(level) + '└─ ' : '';

    tree.forEach(node => {
      result.push({
        id: node.id,
        name: prefix + node.name,
        level,
      });
      if (node.children.length) {
        result = result.concat(this.flattenTree(node.children, level + 1));
      }
    });

    return result;
  }

  private deleteImage(imagePath: string) {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error(`Failed to delete category image: ${fullPath}`, err);
      }
    }
}
