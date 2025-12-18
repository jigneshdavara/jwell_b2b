import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';

@Injectable()
export class TaxesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
      this.prisma.taxes.findMany({
        skip,
        take: perPage,
        include: {
          tax_groups: {
            select: { id: true, name: true }
          }
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.taxes.count(),
    ]);

    // Format items to match Laravel response structure
    const formattedItems = items.map(item => ({
      ...item,
      tax_group: item.tax_groups,
      tax_groups: undefined,
    }));

    // Get active tax groups for UI selection
    const taxGroups = await this.prisma.tax_groups.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    });

    return {
      items: formattedItems,
      taxGroups,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async findOne(id: number) {
    const tax = await this.prisma.taxes.findUnique({
      where: { id: BigInt(id) },
      include: {
        tax_groups: true
      }
    });
    if (!tax) {
      throw new NotFoundException('Tax not found');
    }
    return {
      ...tax,
      tax_group: tax.tax_groups,
      tax_groups: undefined,
    };
  }

  async create(dto: CreateTaxDto) {
    return await this.prisma.taxes.create({
      data: {
        tax_group_id: BigInt(dto.tax_group_id),
        name: dto.name,
        code: dto.code,
        rate: dto.rate,
        description: dto.description,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateTaxDto) {
    await this.findOne(id);
    return await this.prisma.taxes.update({
      where: { id: BigInt(id) },
      data: {
        tax_group_id: dto.tax_group_id ? BigInt(dto.tax_group_id) : undefined,
        name: dto.name,
        code: dto.code,
        rate: dto.rate,
        description: dto.description,
        is_active: dto.is_active,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.taxes.delete({
      where: { id: BigInt(id) },
    });
  }
}
