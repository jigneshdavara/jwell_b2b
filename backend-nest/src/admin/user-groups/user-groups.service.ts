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
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.user_groups.count(),
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
        const group = await this.prisma.user_groups.findUnique({
            where: { id: BigInt(id) },
        });
        if (!group) {
            throw new NotFoundException('User? group not found');
        }
        return group;
    }

    async create(dto: CreateUserGroupDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.user_groups.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.user_groups.findUnique({
                where: { code: dto.code },
            }),
        ]);

        if (existingByName) {
            throw new ConflictException(
                'User? group with this name already exists',
            );
        }

        if (existingByCode) {
            throw new ConflictException(
                'User? group with this code already exists',
            );
        }

        return await this.prisma.user_groups.create({
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order ?? 0,
            },
        });
    }

    async update(id: number, dto: UpdateUserGroupDto) {
        const group = await this.findOne(id);

        if (dto.name && dto.name !== group.name) {
            const existing = await this.prisma.user_groups.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new ConflictException(
                    'User? group with this name already exists',
                );
            }
        }

        if (dto.code && dto.code !== group.code) {
            const existing = await this.prisma.user_groups.findUnique({
                where: { code: dto.code },
            });
            if (existing) {
                throw new ConflictException(
                    'User? group with this code already exists',
                );
            }
        }

        return await this.prisma.user_groups.update({
            where: { id: BigInt(id) },
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return await this.prisma.user_groups.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.user_groups.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }

    async getUsersForAssignment(id: number, search?: string) {
        const group = await this.findOne(id);
        const groupId = BigInt(id);

        // Get users currently in this group
        const usersInGroup = await this.prisma.user.findMany({
            where: { user_group_id: groupId },
            select: { id: true },
        });
        const selectedUserIds = usersInGroup.map((u) => u.id.toString());

        // Get all users (with optional search)
        const users = await this.prisma.user.findMany({
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
            users: users.map((user) => ({
                id: Number(user.id),
                name: user.name,
                email: user.email,
                selected: selectedUserIds.includes(user.id.toString()),
            })),
            selectedUserIds: usersInGroup.map((u) => Number(u.id)),
        };
    }

    async assignUsers(id: number, userIds: number[]) {
        const groupId = BigInt(id);
        const bigIntUserIds = userIds.map((uid) => BigInt(uid));

        // Update all selected users to this group
        await this.prisma.user.updateMany({
            where: { id: { in: bigIntUserIds } },
            data: { user_group_id: groupId },
        });

        // Remove users from this group if they're not in the selected list
        await this.prisma.user.updateMany({
            where: {
                user_group_id: groupId,
                id: { notIn: bigIntUserIds },
            },
            data: { user_group_id: null },
        });

        return { success: true };
    }
}
