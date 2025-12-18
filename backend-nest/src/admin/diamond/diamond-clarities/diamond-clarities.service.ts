import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDiamondClarityDto, UpdateDiamondClarityDto } from './dto/diamond-clarity.dto';

@Injectable()
export class DiamondClaritiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 10) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
      this.prisma.diamond_clarities.findMany({
        skip,
        take: perPage,
        include: {
          diamond_types: {
            select: { id: true, name: true }
          }
        },
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.diamond_clarities.count(),
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
    const item = await this.prisma.diamond_clarities.findUnique({
      where: { id: BigInt(id) },
      include: {
        diamond_types: true
      }
    });
    if (!item) {
      throw new NotFoundException('Diamond clarity not found');
    }
    return item;
  }

  async create(dto: CreateDiamondClarityDto) {
    return await this.prisma.diamond_clarities.create({
      data: {
        diamond_type_id: BigInt(dto.diamond_type_id),
        code: dto.code,
        name: dto.name,
        description: dto.description,
        is_active: dto.is_active ?? true,
        display_order: dto.display_order,
      },
    });
  }

  async update(id: number, dto: UpdateDiamondClarityDto) {
    await this.findOne(id);
    return await this.prisma.diamond_clarities.update({
      where: { id: BigInt(id) },
      data: {
        diamond_type_id: dto.diamond_type_id ? BigInt(dto.diamond_type_id) : undefined,
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
    return await this.prisma.diamond_clarities.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkRemove(ids: number[]) {
    const bigIntIds = ids.map(id => BigInt(id));
    return await this.prisma.diamond_clarities.deleteMany({
      where: { id: { in: bigIntIds } },
    });
  }
}
