import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';

@Injectable()
export class MetalsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
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
        const [existingByName, existingByCode] = await Promise.all([
            this.prisma.metals.findUnique({
                where: { name: dto.name },
            }),
            this.prisma.metals.findUnique({
                where: { code: dto.code },
            }),
        ]);
        if (existingByName) {
            throw new ConflictException('Metal with this name already exists');
        }
        if (existingByCode) {
            throw new ConflictException('Metal with this code already exists');
        }

        await this.prisma.metals.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active ?? true,
                display_order: dto.display_order,
            },
        });
        return {
            success: true,
            message: 'Metal created successfully',
        };
    }

    async update(id: number, dto: UpdateMetalDto) {
        const existing = await this.findOne(id);

        if (dto.name && dto.name !== existing.name) {
            const existingByName = await this.prisma.metals.findUnique({
                where: { name: dto.name },
            });
            if (existingByName) {
                throw new ConflictException(
                    'Metal with this name already exists',
                );
            }
        }
        if (dto.code && dto.code !== existing.code) {
            const existingByCode = await this.prisma.metals.findUnique({
                where: { code: dto.code },
            });
            if (existingByCode) {
                throw new ConflictException(
                    'Metal with this code already exists',
                );
            }
        }

        await this.prisma.metals.update({
            where: { id: BigInt(id) },
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                is_active: dto.is_active,
                display_order: dto.display_order,
            },
        });
        return {
            success: true,
            message: 'Metal updated successfully',
        };
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.prisma.metals.delete({
            where: { id: BigInt(id) },
        });
        return {
            success: true,
            message: 'Metal deleted successfully',
        };
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        await this.prisma.metals.deleteMany({
            where: { id: { in: bigIntIds } },
        });
        return {
            success: true,
            message: 'Metals deleted successfully',
        };
    }
}
