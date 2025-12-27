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
    AdminType,
} from './dto/admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminsService {
    constructor(private prisma: PrismaService) {}

    private readonly INTERNAL_TYPES = [
        AdminType.ADMIN,
        AdminType.SUPER_ADMIN,
        AdminType.PRODUCTION,
        AdminType.SALES,
    ];

    async findAll(page: number, perPage: number) {
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

        const formatTypeLabel = (type: string) => {
            return type
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        return {
            items: items.map((admin) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password, admin_groups, created_at, ...rest } = admin;
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

    async create(dto: CreateAdminDto) {
        const existingAdmin = await this.prisma.admin.findUnique({
            where: { email: dto.email },
        });

        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingAdmin || existingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        await this.prisma.admin.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
                type: dto.type || AdminType.ADMIN,
                admin_group_id: dto.admin_group_id
                    ? BigInt(dto.admin_group_id)
                    : null,
            },
        });

        return { success: true, message: 'Admin created successfully' };
    }

    async update(id: number, dto: UpdateAdminDto) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: BigInt(id) },
        });

        if (!admin || !this.INTERNAL_TYPES.includes(admin.type as AdminType)) {
            throw new NotFoundException('Admin not found');
        }

        if (dto.email && dto.email !== admin.email) {
            const existing = await this.prisma.admin.findUnique({
                where: { email: dto.email },
            });
            if (existing) {
                throw new ConflictException('Email already registered');
            }
        }

        const data: {
            name?: string;
            email?: string;
            admin_group_id?: bigint | null;
            type?: AdminType;
            password?: string;
        } = {};

        if (dto.name !== undefined) {
            data.name = dto.name;
        }

        if (dto.email !== undefined) {
            data.email = dto.email;
        }

        if (dto.admin_group_id !== undefined) {
            data.admin_group_id = dto.admin_group_id
                ? BigInt(dto.admin_group_id)
                : null;
        }

        if (dto.type && (admin.type as AdminType) !== AdminType.SUPER_ADMIN) {
            data.type = dto.type;
        }

        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 10);
        }

        await this.prisma.admin.update({
            where: { id: BigInt(id) },
            data,
        });

        return { success: true, message: 'Admin updated successfully' };
    }

    async updateGroup(id: number, dto: UpdateAdminGroupDto) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: BigInt(id) },
        });

        if (!admin || !this.INTERNAL_TYPES.includes(admin.type as AdminType)) {
            throw new NotFoundException('Admin not found');
        }

        await this.prisma.admin.update({
            where: { id: BigInt(id) },
            data: {
                admin_group_id: dto.admin_group_id
                    ? BigInt(dto.admin_group_id)
                    : null,
            },
        });

        return { success: true, message: 'Admin group updated successfully' };
    }

    async remove(id: number) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: BigInt(id) },
        });

        if (!admin || !this.INTERNAL_TYPES.includes(admin.type as AdminType)) {
            throw new NotFoundException('Admin not found');
        }

        if ((admin.type as AdminType) === AdminType.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot delete super-admin admin');
        }

        await this.prisma.admin.delete({
            where: { id: BigInt(id) },
        });

        return { success: true, message: 'Admin deleted successfully' };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        const admins = await this.prisma.admin.findMany({
            where: {
                id: { in: bigIntIds },
            },
        });

        const validIds = admins
            .filter(
                (u) =>
                    this.INTERNAL_TYPES.includes(u.type as AdminType) &&
                    (u.type as AdminType) !== AdminType.SUPER_ADMIN,
            )
            .map((u) => u.id);

        if (validIds.length === 0) return { count: 0 };

        await this.prisma.admin.deleteMany({
            where: { id: { in: validIds } },
        });

        return { success: true, message: 'Admins deleted successfully' };
    }
}
