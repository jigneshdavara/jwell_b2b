import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaxGroupDto, UpdateTaxGroupDto } from './dto/tax-group.dto';

@Injectable()
export class TaxGroupsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.tax_groups.findMany({
                skip,
                take: perPage,
                include: {
                    _count: {
                        select: { taxes: true },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.tax_groups.count(),
        ]);

        return {
            items: items.map((item) => ({
                ...item,
                taxes_count: item._count.taxes,
                _count: undefined,
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
        const group = await this.prisma.tax_groups.findUnique({
            where: { id: BigInt(id) },
        });
        if (!group) {
            throw new NotFoundException('Tax group not found');
        }
        return group;
    }

    async create(dto: CreateTaxGroupDto) {
        return await this.prisma.tax_groups.create({
            data: {
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
            },
        });
    }

    async update(id: number, dto: UpdateTaxGroupDto) {
        await this.findOne(id);
        return await this.prisma.tax_groups.update({
            where: { id: BigInt(id) },
            data: {
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return await this.prisma.tax_groups.delete({
            where: { id: BigInt(id) },
        });
    }
}
