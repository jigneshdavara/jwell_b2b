import {
    Injectable,
    ConflictException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateTeamUserDto,
    UpdateTeamUserDto,
    UpdateUserGroupDto,
    UserType,
} from './dto/team-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeamUsersService {
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
            this.prisma.user.findMany({
                where: {
                    type: { in: this.INTERNAL_TYPES },
                },
                skip,
                take: perPage,
                include: {
                    user_groups: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.user.count({
                where: {
                    type: { in: this.INTERNAL_TYPES },
                },
            }),
        ]);

        return {
            items: items.map((user) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password, ...rest } = user;
                return rest;
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
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
            include: {
                user_groups: true,
            },
        });

        if (!user || !this.INTERNAL_TYPES.includes(user.type as UserType)) {
            throw new NotFoundException('Team user not found');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = user;
        return rest;
    }

    async create(dto: CreateTeamUserDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        return await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
                type: dto.type || UserType.ADMIN,
                user_group_id: dto.user_group_id
                    ? BigInt(dto.user_group_id)
                    : null,
            },
        });
    }

    async update(id: number, dto: UpdateTeamUserDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });

        if (!user || !this.INTERNAL_TYPES.includes(user.type as UserType)) {
            throw new NotFoundException('Team user not found');
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
            user_group_id: dto.user_group_id ? BigInt(dto.user_group_id) : null,
        };

        if (dto.type && user.type !== UserType.SUPER_ADMIN) {
            data.type = dto.type;
        }

        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 10);
        }

        return await this.prisma.user.update({
            where: { id: BigInt(id) },
            data,
        });
    }

    async updateGroup(id: number, dto: UpdateUserGroupDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });

        if (!user || !this.INTERNAL_TYPES.includes(user.type as UserType)) {
            throw new NotFoundException('Team user not found');
        }

        return await this.prisma.user.update({
            where: { id: BigInt(id) },
            data: {
                user_group_id: BigInt(dto.user_group_id),
            },
        });
    }

    async remove(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });

        if (!user || !this.INTERNAL_TYPES.includes(user.type as UserType)) {
            throw new NotFoundException('Team user not found');
        }

        if (user.type === UserType.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot delete super-admin user');
        }

        return await this.prisma.user.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));

        // Filter out super admins and non-internal users
        const users = await this.prisma.user.findMany({
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

        return await this.prisma.user.deleteMany({
            where: { id: { in: validIds } },
        });
    }
}
