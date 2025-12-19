import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserGroupDto, UpdateUserGroupDto } from './dto/user-group.dto';

@Injectable()
export class UserGroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
      this.prisma.user_groups.findMany({
        skip,
        take: perPage,
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.user_groups.count(),
    ]);

    return {
      items: items.map(group => ({
        ...group,
        id: Number(group.id),
        features: Array.isArray(group.features) ? group.features : [],
      })),
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async findOne(id: number) {
    const group = await this.prisma.user_groups.findUnique({
      where: { id: BigInt(id) },
    });
    if (!group) {
      throw new NotFoundException('User group not found');
    }
    return {
      ...group,
      id: Number(group.id),
      features: Array.isArray(group.features) ? group.features : [],
    };
  }

  async create(dto: CreateUserGroupDto) {
    const existing = await this.prisma.user_groups.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('User group with this name already exists');
    }

    const slug = await this.generateUniqueSlug(dto.name);
    const group = await this.prisma.user_groups.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        features: dto.features,
        is_active: dto.is_active ?? true,
        position: dto.position ?? 0,
      },
    });
    return {
      ...group,
      id: Number(group.id),
      features: Array.isArray(group.features) ? group.features : [],
    };
  }

  async update(id: number, dto: UpdateUserGroupDto) {
    const existingGroup = await this.findOne(id);
    
    if (dto.name && dto.name !== existingGroup.name) {
      const existing = await this.prisma.user_groups.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('User group with this name already exists');
      }
    }

    let slug = existingGroup.slug;
    if (dto.name && dto.name !== existingGroup.name) {
      slug = await this.generateUniqueSlug(dto.name, id);
    }

    const updatedGroup = await this.prisma.user_groups.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        features: dto.features,
        is_active: dto.is_active,
        position: dto.position,
      },
    });
    return {
      ...updatedGroup,
      id: Number(updatedGroup.id),
      features: Array.isArray(updatedGroup.features) ? updatedGroup.features : [],
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.user_groups.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkRemove(ids: number[]) {
    const bigIntIds = ids.map(id => BigInt(id));
    return await this.prisma.user_groups.deleteMany({
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
      const existing = await this.prisma.user_groups.findFirst({
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