import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerGroupDto, UpdateCustomerGroupDto } from './dto/customer-group.dto';

@Injectable()
export class CustomerGroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
      this.prisma.customer_groups.findMany({
        skip,
        take: perPage,
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.customer_groups.count(),
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
    const group = await this.prisma.customer_groups.findUnique({
      where: { id: BigInt(id) },
    });
    if (!group) {
      throw new NotFoundException('Customer group not found');
    }
    return group;
  }

  async create(dto: CreateCustomerGroupDto) {
    const existing = await this.prisma.customer_groups.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Customer group with this name already exists');
    }

    const slug = await this.generateUniqueSlug(dto.name);
    return await this.prisma.customer_groups.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        is_active: dto.is_active ?? true,
        position: dto.position ?? 0,
      },
    });
  }

  async update(id: number, dto: UpdateCustomerGroupDto) {
    const group = await this.findOne(id);
    
    if (dto.name && dto.name !== group.name) {
      const existing = await this.prisma.customer_groups.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Customer group with this name already exists');
      }
    }
    
    let slug = group.slug;
    if (dto.name && dto.name !== group.name) {
      slug = await this.generateUniqueSlug(dto.name, id);
    }

    return await this.prisma.customer_groups.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        is_active: dto.is_active,
        position: dto.position,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.customer_groups.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkRemove(ids: number[]) {
    const bigIntIds = ids.map(id => BigInt(id));
    return await this.prisma.customer_groups.deleteMany({
      where: { id: { in: bigIntIds } },
    });
  }

  private async generateUniqueSlug(name: string, ignoreId?: number): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.customer_groups.findFirst({
        where: {
          slug,
          id: ignoreId ? { not: BigInt(ignoreId) } : undefined,
        },
      });

      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  }
}
