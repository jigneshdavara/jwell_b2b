import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';

@Injectable()
export class OffersService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 20) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.offers.findMany({
                skip,
                take: perPage,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.offers.count(),
        ]);

        return {
            items: items.map((item) => ({
                ...item,
                id: Number(item.id),
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
        const offer = await this.prisma.offers.findUnique({
            where: { id: BigInt(id) },
        });
        if (!offer) {
            throw new NotFoundException('Offer not found');
        }
        return {
            ...offer,
            id: Number(offer.id),
        };
    }

    async create(dto: CreateOfferDto) {
        const offer = await this.prisma.offers.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                type: dto.type,
                value: dto.value,
                constraints: dto.constraints,
                starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
                ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
                is_active: dto.is_active ?? true,
            },
        });
        return {
            ...offer,
            id: Number(offer.id),
        };
    }

    async update(id: number, dto: UpdateOfferDto) {
        await this.findOne(id);
        const offer = await this.prisma.offers.update({
            where: { id: BigInt(id) },
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                type: dto.type,
                value: dto.value,
                constraints: dto.constraints,
                starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
                ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
                is_active: dto.is_active,
            },
        });
        return {
            ...offer,
            id: Number(offer.id),
        };
    }

    async remove(id: number) {
        await this.findOne(id);
        return await this.prisma.offers.delete({
            where: { id: BigInt(id) },
        });
    }
}
