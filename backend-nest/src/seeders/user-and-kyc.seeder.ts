import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { BaseSeeder } from './base-seeder';

export class UserAndKycSeeder extends BaseSeeder {
    async run(): Promise<void> {
        const hashedPassword = await bcrypt.hash('password', 10);

        // Create admin accounts
        const adminAccounts = [
            {
                email: 'admin@b2b.test',
                name: 'Demo Super Admin',
                password: hashedPassword,
                type: 'super-admin',
            },
            {
                email: 'sales@b2b.test',
                name: 'Demo Sales Manager',
                password: hashedPassword,
                type: 'sales',
            },
            {
                email: 'production@b2b.test',
                name: 'Demo Production Lead',
                password: hashedPassword,
                type: 'production',
            },
        ];

        for (const admin of adminAccounts) {
            await this.prisma.admin.upsert({
                where: { email: admin.email },
                update: {
                    name: admin.name,
                    password: admin.password,
                    type: admin.type,
                },
                create: {
                    email: admin.email,
                    name: admin.name,
                    password: admin.password,
                    type: admin.type,
                },
            });
        }

        this.log(`Seeded ${adminAccounts.length} admin accounts`);

        // Create customer accounts
        const customerAccounts = [
            {
                email: 'retailer@b2b.test',
                name: 'Demo Retailer',
                password: hashedPassword,
                type: 'retailer',
                kyc_status: 'approved',
                phone: '9822310801',
                business_name: 'Demo Retail Store',
            },
            {
                email: 'wholesaler@b2b.test',
                name: 'Demo Wholesaler',
                password: hashedPassword,
                type: 'wholesaler',
                kyc_status: 'approved',
                phone: '9822310802',
                business_name: 'Demo Wholesale Store',
            },
        ];

        for (const customer of customerAccounts) {
            await this.prisma.user.upsert({
                where: { email: customer.email },
                update: {
                    name: customer.name,
                    password: customer.password,
                    type: customer.type,
                    kyc_status: customer.kyc_status,
                    phone: customer.phone,
                    business_name: customer.business_name,
                },
                create: {
                    email: customer.email,
                    name: customer.name,
                    password: customer.password,
                    type: customer.type,
                    kyc_status: customer.kyc_status,
                    phone: customer.phone,
                    business_name: customer.business_name,
                    country: 'India',
                },
            });
        }

        this.log(`Seeded ${customerAccounts.length} customer accounts`);

        // Create additional test users
        const retailerCount = await this.prisma.user.count({
            where: { type: 'retailer' },
        });

        if (retailerCount < 20) {
            const retailersToCreate = 20 - retailerCount;
            for (let i = 0; i < retailersToCreate; i++) {
                await this.prisma.user.create({
                    data: {
                        email: `retailer${i + 1}@test.com`,
                        name: `Test Retailer ${i + 1}`,
                        password: hashedPassword,
                        type: 'retailer',
                        kyc_status: 'approved',
                        business_name: `Retail Store ${i + 1}`,
                        country: 'India',
                    },
                });
            }
            this.log(`Created ${retailersToCreate} additional retailers`);
        }

        const wholesalerCount = await this.prisma.user.count({
            where: { type: 'wholesaler' },
        });

        if (wholesalerCount < 20) {
            const wholesalersToCreate = 20 - wholesalerCount;
            for (let i = 0; i < wholesalersToCreate; i++) {
                await this.prisma.user.create({
                    data: {
                        email: `wholesaler${i + 1}@test.com`,
                        name: `Test Wholesaler ${i + 1}`,
                        password: hashedPassword,
                        type: 'wholesaler',
                        kyc_status: 'approved',
                        business_name: `Wholesale Store ${i + 1}`,
                        country: 'India',
                    },
                });
            }
            this.log(`Created ${wholesalersToCreate} additional wholesalers`);
        }

        // Create pending KYC users
        const pendingRetailerCount = await this.prisma.user.count({
            where: { type: 'retailer', kyc_status: 'pending' },
        });

        if (pendingRetailerCount < 5) {
            const pendingToCreate = 5 - pendingRetailerCount;
            for (let i = 0; i < pendingToCreate; i++) {
                await this.prisma.user.create({
                    data: {
                        email: `pending-retailer${i + 1}@test.com`,
                        name: `Pending Retailer ${i + 1}`,
                        password: hashedPassword,
                        type: 'retailer',
                        kyc_status: 'pending',
                        business_name: `Pending Retail Store ${i + 1}`,
                        country: 'India',
                    },
                });
            }
            this.log(`Created ${pendingToCreate} pending retailer accounts`);
        }

        const pendingWholesalerCount = await this.prisma.user.count({
            where: { type: 'wholesaler', kyc_status: 'pending' },
        });

        if (pendingWholesalerCount < 5) {
            const pendingToCreate = 5 - pendingWholesalerCount;
            for (let i = 0; i < pendingToCreate; i++) {
                await this.prisma.user.create({
                    data: {
                        email: `pending-wholesaler${i + 1}@test.com`,
                        name: `Pending Wholesaler ${i + 1}`,
                        password: hashedPassword,
                        type: 'wholesaler',
                        kyc_status: 'pending',
                        business_name: `Pending Wholesale Store ${i + 1}`,
                        country: 'India',
                    },
                });
            }
            this.log(`Created ${pendingToCreate} pending wholesaler accounts`);
        }
    }
}
