import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';

@Injectable()
export class MetalsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.metals.findMany({
                skip,
                take: perPage,
                orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.metals.count(),
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
        const metal = await this.prisma.metals.findUnique({
            where: { id: BigInt(id) },
        });
        if (!metal) {
            throw new NotFoundException('Metal not found');
        }
        return metal;
    }

    async create(dto: CreateMetalDto) {
        return await this.prisma.metals.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
            },
        });
    }

    async update(id: number, dto: UpdateMetalDto) {
        await this.findOne(id);
        return await this.prisma.metals.update({
            where: { id: BigInt(id) },
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return await this.prisma.metals.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.metals.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }
}
