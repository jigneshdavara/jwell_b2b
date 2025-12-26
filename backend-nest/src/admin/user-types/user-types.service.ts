import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserTypeDto, UpdateUserTypeDto } from './dto/user-type.dto';

@Injectable()
export class UserTypesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 20) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.user_types.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.user_types.count(),
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
        const type = await this.prisma.user_types.findUnique({
            where: { id: BigInt(id) },
        });
        if (!type) {
            throw new NotFoundException('User? type not found');
        }
        return type;
    }

    async create(dto: CreateUserTypeDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.user_types.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.user_types.findUnique({
                where: { code: dto.code },
            }),
        ]);

        if (existingByName) {
            throw new ConflictException(
                'User? type with this name already exists',
            );
        }

        if (existingByCode) {
            throw new ConflictException(
                'User? type with this code already exists',
            );
        }

        return await this.prisma.user_types.create({
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order ?? 0,
            },
        });
    }

    async update(id: number, dto: UpdateUserTypeDto) {
        const type = await this.findOne(id);

        if (dto.name && dto.name !== type.name) {
            const existing = await this.prisma.user_types.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new ConflictException(
                    'User? type with this name already exists',
                );
            }
        }

        if (dto.code && dto.code !== type.code) {
            const existing = await this.prisma.user_types.findUnique({
                where: { code: dto.code },
            });
            if (existing) {
                throw new ConflictException(
                    'User? type with this code already exists',
                );
            }
        }

        return await this.prisma.user_types.update({
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
        return await this.prisma.user_types.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.user_types.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }
}
