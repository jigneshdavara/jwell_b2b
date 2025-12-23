import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateUserGroupDto,
    UpdateUserGroupDto,
} from './dto/user-group.dto';

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
}
