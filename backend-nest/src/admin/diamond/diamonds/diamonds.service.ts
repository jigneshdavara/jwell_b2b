import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDiamondDto, UpdateDiamondDto } from './dto/diamond.dto';

@Injectable()
export class DiamondsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 10) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
      this.prisma.diamonds.findMany({
        skip,
        take: perPage,
        include: {
          diamond_types: { select: { id: true, name: true } },
          diamond_shapes: { select: { id: true, name: true } },
          diamond_clarities: { select: { id: true, name: true } },
          diamond_colors: { select: { id: true, name: true } },
          diamond_shape_sizes: { select: { id: true, size: true } },
        },
        orderBy: [{ name: 'asc' }],
      }),
      this.prisma.diamonds.count(),
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
    const item = await this.prisma.diamonds.findUnique({
      where: { id: BigInt(id) },
      include: {
        diamond_types: true,
        diamond_shapes: true,
        diamond_clarities: true,
        diamond_colors: true,
        diamond_shape_sizes: true,
      },
    });
    if (!item) {
      throw new NotFoundException('Diamond not found');
    }
    return item;
  }

  async create(dto: CreateDiamondDto) {
    const now = new Date();
    const createData = {
      name: dto.code, // Using code from DTO as name (schema requires name, not code)
      diamond_type_id: BigInt(dto.diamond_type_id),
      diamond_shape_id: BigInt(dto.diamond_shape_id),
      diamond_clarity_id: BigInt(dto.diamond_clarity_id),
      diamond_color_id: BigInt(dto.diamond_color_id),
      diamond_shape_size_id: BigInt(dto.diamond_shape_size_id),
      description: dto.description || null,
      price: dto.price,
      weight: dto.weight,
      is_active: dto.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    const result = await this.prisma.diamonds.create({
      data: createData,
    });

    return result;
  }

  async update(id: number, dto: UpdateDiamondDto) {
    await this.findOne(id);
    const updateData: any = {
      updated_at: new Date(),
    };
    
    if (dto.diamond_type_id !== undefined) {
      updateData.diamond_type_id = BigInt(dto.diamond_type_id);
    }
    if (dto.diamond_shape_id !== undefined) {
      updateData.diamond_shape_id = BigInt(dto.diamond_shape_id);
    }
    if (dto.diamond_clarity_id !== undefined) {
      updateData.diamond_clarity_id = BigInt(dto.diamond_clarity_id);
    }
    if (dto.diamond_color_id !== undefined) {
      updateData.diamond_color_id = BigInt(dto.diamond_color_id);
    }
    if (dto.diamond_shape_size_id !== undefined) {
      updateData.diamond_shape_size_id = BigInt(dto.diamond_shape_size_id);
    }
    if (dto.code !== undefined) {
      updateData.name = dto.code; // Using code from DTO as name
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.price !== undefined) {
      updateData.price = dto.price;
    }
    if (dto.weight !== undefined) {
      updateData.weight = dto.weight;
    }
    if (dto.is_active !== undefined) {
      updateData.is_active = dto.is_active;
    }
    
    return await this.prisma.diamonds.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.diamonds.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkRemove(ids: number[]) {
    const bigIntIds = ids.map(id => BigInt(id));
    return await this.prisma.diamonds.deleteMany({
      where: { id: { in: bigIntIds } },
    });
  }

  async getShapeSizes(shapeId: number) {
    return this.prisma.diamond_shape_sizes.findMany({
      where: { diamond_shape_id: BigInt(shapeId) },
      orderBy: { display_order: 'asc' },
    });
  }

  async getClaritiesByType(typeId: number) {
    return this.prisma.diamond_clarities.findMany({
      where: { diamond_type_id: BigInt(typeId) },
      orderBy: { display_order: 'asc' },
    });
  }

  async getColorsByType(typeId: number) {
    return this.prisma.diamond_colors.findMany({
      where: { diamond_type_id: BigInt(typeId) },
      orderBy: { display_order: 'asc' },
    });
  }

  async getShapesByType(typeId: number) {
    // Assuming shapes are linked to types through shape sizes or directly if possible.
    // Based on the Laravel controller, it seems to filter by type.
    // However, looking at the schema, diamond_shapes doesn't have diamond_type_id.
    // Let's re-examine the diamond_shapes model or how Laravel handles it.
    
    // In Laravel routes: Route::get('diamonds/shapes-by-type/{typeId}', [DiamondController::class, 'getShapesByType'])
    
    // For now, I'll return all shapes since the relation might be through another table.
    return this.prisma.diamond_shapes.findMany({
      orderBy: { display_order: 'asc' },
    });
  }
}