import {
    Injectable,
    ConflictException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateAdminDto,
    UpdateAdminDto,
    UpdateAdminGroupDto,
    UserType,
} from './dto/admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
    constructor(private prisma: PrismaService) {}

    private readonly INTERNAL_TYPES = [
        UserType.ADMIN,
        UserType.SUPER_ADMIN,
        UserType.PRODUCTION,
        UserType.SALES,
    ];

    async findAll(page: number = 1, perPage: number = 20) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.admin.findMany({
                where: {
                    type: { in: this.INTERNAL_TYPES },
                },
                skip,
                take: perPage,
                include: {
                    admin_groups: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.admin.count({
                where: {
                    type: { in: this.INTERNAL_TYPES },
                },
            }),
        ]);

        // Helper to format type label
        const formatTypeLabel = (type: string) => {
            return type
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        return {
            items: items.map((user) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password, admin_groups, created_at, ...rest } = user;
                return {
                    ...rest,
                    id: Number(rest.id),
                    admin_group: admin_groups
                        ? {
                              id: Number(admin_groups.id),
                              name: admin_groups.name,
                          }
                        : null,
                    type_label: formatTypeLabel(rest.type),
                    joined_at: created_at,
                };
            }),
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const user = await this.prisma.admin.findUnique({
            where: { id: BigInt(id) },
            include: {
                admin_groups: true,
            },
        });

        if (!user || !this.INTERNAL_TYPES.includes(user.type as UserType)) {
            throw new NotFoundException('Admin not found');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = user;
        return rest;
    }

    async create(dto: CreateAdminDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        return await this.prisma.admin.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
                type: dto.type || UserType.ADMIN,
                admin_group_id: dto.admin_group_id
                    ? BigInt(dto.admin_group_id)
                    : null,
            },
        });
    }

    async update(id: number, dto: UpdateAdminDto) {
        const user = await this.prisma.admin.findUnique({
            where: { id: BigInt(id) },
        });

        if (!user || !this.INTERNAL_TYPES.includes(user.type as UserType)) {
            throw new NotFoundException('Admin not found');
        }

        if (dto.email && dto.email !== user.email) {
            const existing = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (existing) {
                throw new ConflictException('Email already registered');
            }
        }

        const data: any = {
            name: dto.name,
            email: dto.email,
            admin_group_id: dto.admin_group_id
                ? BigInt(dto.admin_group_id)
                : null,
        };

        if (dto.type && user.type !== UserType.SUPER_ADMIN) {
            data.type = dto.type;
        }

        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 10);
        }

        return await this.prisma.admin.update({
            where: { id: BigInt(id) },
            data,
        });
    }

    async updateGroup(id: number, dto: UpdateAdminGroupDto) {
        const user = await this.prisma.admin.findUnique({
            where: { id: BigInt(id) },
        });

        if (!user || !this.INTERNAL_TYPES.includes(user.type as UserType)) {
            throw new NotFoundException('Admin not found');
        }

        return await this.prisma.admin.update({
            where: { id: BigInt(id) },
            data: {
                admin_group_id: dto.admin_group_id
                    ? BigInt(dto.admin_group_id)
                    : null,
            },
        });
    }

    async remove(id: number) {
        const user = await this.prisma.admin.findUnique({
            where: { id: BigInt(id) },
        });

        if (!user || !this.INTERNAL_TYPES.includes(user.type as UserType)) {
            throw new NotFoundException('Admin not found');
        }

        if (user.type === UserType.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot delete super-admin user');
        }

        return await this.prisma.admin.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Filter out super admins and non-internal users
        const users = await this.prisma.admin.findMany({
            where: {
                id: { in: bigIntIds },
            },
        });

        const validIds = users
            .filter(
                (u) =>
                    this.INTERNAL_TYPES.includes(u.type as UserType) &&
                    u.type !== UserType.SUPER_ADMIN,
            )
            .map((u) => u.id);

        if (validIds.length === 0) return { count: 0 };

        return await this.prisma.admin.deleteMany({
            where: { id: { in: validIds } },
        });
    }
}
