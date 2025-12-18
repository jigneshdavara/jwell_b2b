import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDiamondTypeDto, UpdateDiamondTypeDto } from './dto/diamond-type.dto';

@Injectable()
export class DiamondTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 10) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
      this.prisma.diamond_types.findMany({
        skip,
        take: perPage,
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.diamond_types.count(),
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
    const item = await this.prisma.diamond_types.findUnique({
      where: { id: BigInt(id) },
    });
    if (!item) {
      throw new NotFoundException('Diamond type not found');
    }
    return item;
  }

  async create(dto: CreateDiamondTypeDto) {
    return await this.prisma.diamond_types.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        is_active: dto.is_active ?? true,
        display_order: dto.display_order,
      },
    });
  }

  async update(id: number, dto: UpdateDiamondTypeDto) {
    await this.findOne(id);
    return await this.prisma.diamond_types.update({
      where: { id: BigInt(id) },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        is_active: dto.is_active,
        display_order: dto.display_order,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.diamond_types.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkRemove(ids: number[]) {
    const bigIntIds = ids.map(id => BigInt(id));
    return await this.prisma.diamond_types.deleteMany({
      where: { id: { in: bigIntIds } },
    });
  }
}
