import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 10) {
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
    return await this.prisma.brands.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        is_active: dto.is_active ?? true,
        display_order: dto.display_order,
        cover_image: coverImage,
      },
    });
  }

  async update(id: number, dto: UpdateBrandDto, coverImage?: string) {
    const brand = await this.findOne(id);
    
    let imageToUpdate: string | undefined = coverImage;
    if (dto.remove_cover_image && brand.cover_image) {
      this.deleteImage(brand.cover_image);
      imageToUpdate = undefined;
    } else if (coverImage && brand.cover_image) {
      // New image uploaded, delete old one
      this.deleteImage(brand.cover_image);
    } else if (!coverImage) {
      // No new image, preserve existing unless removed
      imageToUpdate = brand.cover_image ?? undefined;
    }

    return await this.prisma.brands.update({
      where: { id: BigInt(id) },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        is_active: dto.is_active,
        display_order: dto.display_order,
        cover_image: imageToUpdate,
      },
    });
  }

  async remove(id: number) {
    const brand = await this.findOne(id);
    if (brand.cover_image) {
      this.deleteImage(brand.cover_image);
    }
    return await this.prisma.brands.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkRemove(ids: number[]) {
    const bigIntIds = ids.map(id => BigInt(id));
    const brands = await this.prisma.brands.findMany({
      where: { id: { in: bigIntIds } },
      select: { cover_image: true },
    });

    for (const brand of brands) {
      if (brand.cover_image) {
        this.deleteImage(brand.cover_image);
      }
    }

    return await this.prisma.brands.deleteMany({
      where: { id: { in: bigIntIds } },
    });
  }

  private deleteImage(imagePath: string) {
    // Assuming imagePath is relative to the storage root
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
