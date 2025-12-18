import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMetalToneDto, UpdateMetalToneDto } from './dto/metal-tone.dto';

@Injectable()
export class MetalTonesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 10) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
      this.prisma.metal_tones.findMany({
        skip,
        take: perPage,
        include: {
          metals: {
            select: { id: true, name: true }
          }
        },
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.metal_tones.count(),
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
    const tone = await this.prisma.metal_tones.findUnique({
      where: { id: BigInt(id) },
      include: {
        metals: true
      }
    });
    if (!tone) {
      throw new NotFoundException('Metal tone not found');
    }
    return tone;
  }

  async create(dto: CreateMetalToneDto) {
    return await this.prisma.metal_tones.create({
      data: {
        metal_id: BigInt(dto.metal_id),
        code: dto.code,
        name: dto.name,
        description: dto.description,
        is_active: dto.is_active ?? true,
        display_order: dto.display_order,
      },
    });
  }

  async update(id: number, dto: UpdateMetalToneDto) {
    await this.findOne(id);
    return await this.prisma.metal_tones.update({
      where: { id: BigInt(id) },
      data: {
        metal_id: dto.metal_id ? BigInt(dto.metal_id) : undefined,
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
    return await this.prisma.metal_tones.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkRemove(ids: number[]) {
    const bigIntIds = ids.map(id => BigInt(id));
    return await this.prisma.metal_tones.deleteMany({
      where: { id: { in: bigIntIds } },
    });
  }
}
