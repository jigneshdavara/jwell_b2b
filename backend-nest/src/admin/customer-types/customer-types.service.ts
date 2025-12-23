import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateCustomerTypeDto,
    UpdateCustomerTypeDto,
} from './dto/customer-type.dto';

@Injectable()
export class CustomerTypesService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 20) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.customer_types.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.customer_types.count(),
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
        const type = await this.prisma.customer_types.findUnique({
            where: { id: BigInt(id) },
        });
        if (!type) {
            throw new NotFoundException('Customer type not found');
        }
        return type;
    }

    async create(dto: CreateCustomerTypeDto) {
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.customer_types.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.customer_types.findUnique({
                where: { code: dto.code },
            }),
        ]);

        if (existingByName) {
            throw new ConflictException(
                'Customer type with this name already exists',
            );
        }

        if (existingByCode) {
            throw new ConflictException(
                'Customer type with this code already exists',
            );
        }

        return await this.prisma.customer_types.create({
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order ?? 0,
            },
        });
    }

    async update(id: number, dto: UpdateCustomerTypeDto) {
        const type = await this.findOne(id);

        if (dto.name && dto.name !== type.name) {
            const existing = await this.prisma.customer_types.findUnique({
                where: { name: dto.name },
            });
            if (existing) {
                throw new ConflictException(
                    'Customer type with this name already exists',
                );
            }
        }

        if (dto.code && dto.code !== type.code) {
            const existing = await this.prisma.customer_types.findUnique({
                where: { code: dto.code },
            });
            if (existing) {
                throw new ConflictException(
                    'Customer type with this code already exists',
                );
            }
        }

        return await this.prisma.customer_types.update({
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
        return await this.prisma.customer_types.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.customer_types.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }
}

