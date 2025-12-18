import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { KycModule } from './kyc/kyc.module';
import { CustomersModule } from './admin/customers/customers.module';
import { CustomerGroupsModule } from './admin/customer-groups/customer-groups.module';
import { DashboardModule } from './admin/dashboard/dashboard.module';
import { UserGroupsModule } from './admin/user-groups/user-groups.module';
import { TeamUsersModule } from './admin/team-users/team-users.module';
import { MetalsModule } from './admin/metals/metals.module';
import { MetalPuritiesModule } from './admin/metal-purities/metal-purities.module';
import { MetalTonesModule } from './admin/metal-tones/metal-tones.module';
import { RatesModule } from './admin/rates/rates.module';
import { DiamondTypesModule } from './admin/diamond/diamond-types/diamond-types.module';
import { DiamondClaritiesModule } from './admin/diamond/diamond-clarities/diamond-clarities.module';
import { DiamondColorsModule } from './admin/diamond/diamond-colors/diamond-colors.module';
import { DiamondShapesModule } from './admin/diamond/diamond-shapes/diamond-shapes.module';
import { DiamondShapeSizesModule } from './admin/diamond/diamond-shape-sizes/diamond-shape-sizes.module';
import { DiamondsModule } from './admin/diamond/diamonds/diamonds.module';
import { StylesModule } from './admin/styles/styles.module';
import { SizesModule } from './admin/sizes/sizes.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    KycModule,
    CustomersModule,
    CustomerGroupsModule,
    DashboardModule,
    UserGroupsModule,
    TeamUsersModule,
    MetalsModule,
    MetalPuritiesModule,
    MetalTonesModule,
    RatesModule,
    DiamondTypesModule,
    DiamondClaritiesModule,
    DiamondColorsModule,
    DiamondShapesModule,
    DiamondShapeSizesModule,
    DiamondsModule,
    StylesModule,
    SizesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
