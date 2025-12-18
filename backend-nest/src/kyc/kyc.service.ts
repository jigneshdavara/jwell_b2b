import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateKycProfileDto, UpdateKycStatusDto } from './dto/kyc.dto';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: bigint) {
    const profile = await this.prisma.userKycProfile.findFirst({
      where: { user_id: userId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            kyc_status: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('KYC profile not found');
    }

    return profile;
  }

  async updateProfile(userId: bigint, dto: UpdateKycProfileDto) {
    // Since user_id is not marked as @unique in Prisma but is logically unique,
    // we use updateMany or find first then update by id.
    const profile = await this.prisma.userKycProfile.findFirst({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('KYC profile not found');
    }

    return await this.prisma.userKycProfile.update({
      where: { id: profile.id },
      data: {
        ...dto,
        updated_at: new Date(),
      },
    });
  }

  async uploadDocument(userId: bigint, type: string, filePath: string) {
    return await this.prisma.user_kyc_documents.create({
      data: {
        user_id: userId,
        type,
        file_path: filePath,
        status: 'pending',
      },
    });
  }

  async getDocuments(userId: bigint) {
    return await this.prisma.user_kyc_documents.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateStatus(userId: bigint, dto: UpdateKycStatusDto, adminId?: bigint) {
    return await this.prisma.$transaction(async (tx) => {
      // Update customer status
      await tx.customer.update({
        where: { id: userId },
        data: { kyc_status: dto.status },
      });

      // Verify if adminId exists in User table to avoid FK violation
      let validAdminId: bigint | undefined = undefined;
      if (adminId) {
        const adminUser = await tx.user.findUnique({ where: { id: adminId } });
        if (adminUser) {
          validAdminId = adminId;
        }
      }

      // Log the status change in messages (audit trail)
      if (dto.remarks || dto.status) {
        await tx.user_kyc_messages.create({
          data: {
            user_id: userId,
            admin_id: validAdminId, // Use valid admin ID or null
            sender_type: 'admin', // sender_type must be 'admin' or 'customer'
            message: `KYC Status updated to ${dto.status}. Remarks: ${dto.remarks || 'None'}`,
          },
        });
      }

      return { status: dto.status };
    });
  }

  async getMessages(userId: bigint) {
    return await this.prisma.user_kyc_messages.findMany({
      where: { user_id: userId },
      include: {
        users: {
          select: { name: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async addMessage(userId: bigint, message: string, adminId?: bigint) {
    return await this.prisma.user_kyc_messages.create({
      data: {
        user_id: userId,
        admin_id: adminId,
        sender_type: adminId ? 'admin' : 'customer',
        message,
      },
    });
  }
}

