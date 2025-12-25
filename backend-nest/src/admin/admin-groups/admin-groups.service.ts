import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminGroupDto, UpdateAdminGroupDto } from './dto/admin-group.dto';

@Injectable()
export class AdminGroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, perPage: number = 20) {
    const skip = (page - 1) * perPage;
    const [items, total] = await Promise.all([
      this.prisma.admin_groups.findMany({
        skip,
        take: perPage,
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.admin_groups.count(),
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
    const group = await this.prisma.admin_groups.findUnique({
      where: { id: BigInt(id) },
    });
    if (!group) {
      throw new NotFoundException('Admin group not found');
    }
    return {
      ...group,
      id: Number(group.id),
      features: Array.isArray(group.features) ? group.features : [],
    };
  }

  async create(dto: CreateAdminGroupDto) {
    const existingByName = await this.prisma.admin_groups.findUnique({
      where: { name: dto.name },
    });
    if (existingByName) {
      throw new ConflictException('Admin group with this name already exists');
    }

    const existingByCode = await this.prisma.admin_groups.findUnique({
      where: { code: dto.code },
    });
    if (existingByCode) {
      throw new ConflictException('Admin group with this code already exists');
    }

    const group = await this.prisma.admin_groups.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        features: dto.features,
        is_active: dto.is_active ?? true,
        display_order: dto.display_order ?? 0,
      },
    });
    return {
      ...group,
      id: Number(group.id),
      features: Array.isArray(group.features) ? group.features : [],
    };
  }

  async update(id: number, dto: UpdateAdminGroupDto) {
    const existingGroup = await this.findOne(id);
    
    if (dto.name && dto.name !== existingGroup.name) {
      const existing = await this.prisma.admin_groups.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Admin group with this name already exists');
      }
    }

    if (dto.code && dto.code !== existingGroup.code) {
      const existing = await this.prisma.admin_groups.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Admin group with this code already exists');
      }
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.features !== undefined) updateData.features = dto.features;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
    if (dto.display_order !== undefined) updateData.display_order = dto.display_order;

    const updatedGroup = await this.prisma.admin_groups.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    return {
      ...updatedGroup,
      id: Number(updatedGroup.id),
      features: Array.isArray(updatedGroup.features) ? updatedGroup.features : [],
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.admin_groups.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkRemove(ids: number[]) {
    const bigIntIds = ids.map(id => BigInt(id));
    return await this.prisma.admin_groups.deleteMany({
      where: { id: { in: bigIntIds } },
    });
  }

  async getAdminsForAssignment(id: number, search?: string) {
    const group = await this.findOne(id);
    const groupId = BigInt(id);

    // Get admins currently in this group
    const adminsInGroup = await this.prisma.admin.findMany({
      where: { admin_group_id: groupId },
      select: { id: true },
    });
    const selectedAdminIds = adminsInGroup.map((a) => a.id.toString());

    // Get all admins (with optional search)
    const admins = await this.prisma.admin.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    return {
      group: {
        id: Number(group.id),
        name: group.name,
      },
      admins: admins.map((admin) => ({
        id: Number(admin.id),
        name: admin.name,
        email: admin.email,
        selected: selectedAdminIds.includes(admin.id.toString()),
      })),
      selectedAdminIds: adminsInGroup.map((a) => Number(a.id)),
    };
  }

  async assignAdmins(id: number, adminIds: number[]) {
    const groupId = BigInt(id);
    const bigIntAdminIds = adminIds.map((aid) => BigInt(aid));

    // Update all selected admins to this group
    await this.prisma.admin.updateMany({
      where: { id: { in: bigIntAdminIds } },
      data: { admin_group_id: groupId },
    });

    // Remove admins from this group if they're not in the selected list
    await this.prisma.admin.updateMany({
      where: {
        admin_group_id: groupId,
        id: { notIn: bigIntAdminIds },
      },
      data: { admin_group_id: null },
    });

    return { success: true };
  }

}