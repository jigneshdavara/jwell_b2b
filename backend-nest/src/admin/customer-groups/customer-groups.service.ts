import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateCustomerGroupDto,
    UpdateCustomerGroupDto,
} from './dto/customer-group.dto';

@Injectable()
export class CustomerGroupsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 20) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.customer_groups.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
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
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.customer_groups.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.customer_groups.findUnique({
                where: { code: dto.code },
            }),
        ]);

        if (existingByName) {
            throw new ConflictException(
                'Customer group with this name already exists',
            );
        }

        if (existingByCode) {
            throw new ConflictException(
                'Customer group with this code already exists',
            );
        }

        return await this.prisma.customer_groups.create({
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order ?? 0,
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
                throw new ConflictException(
                    'Customer group with this name already exists',
                );
            }
        }

        if (dto.code && dto.code !== group.code) {
            const existing = await this.prisma.customer_groups.findUnique({
                where: { code: dto.code },
            });
            if (existing) {
                throw new ConflictException(
                    'Customer group with this code already exists',
                );
            }
        }

        return await this.prisma.customer_groups.update({
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
        return await this.prisma.customer_groups.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.customer_groups.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }
}
