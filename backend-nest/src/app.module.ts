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
import { BrandsModule } from './admin/brands/brands.module';
import { CategoriesModule } from './admin/categories/categories.module';
import { GeneralSettingsModule } from './admin/settings/general/general.module';
import { TaxGroupsModule } from './admin/settings/tax-groups/tax-groups.module';
import { TaxesModule } from './admin/settings/taxes/taxes.module';
import { OffersModule } from './admin/offers/offers.module';
import { MakingChargeDiscountsModule } from './admin/offers/making-charge-discounts/making-charge-discounts.module';
import { ProductsModule } from './admin/products/products.module';
import { QuotationsModule } from './quotations/quotations.module';
import { AdminQuotationsModule } from './admin/quotations/quotations.module';
import { OrdersModule } from './admin/orders/orders.module';
import { OrderStatusesModule } from './admin/orders/order-statuses/order-statuses.module';
import { CartModule } from './cart/cart.module';
import { PricingModule } from './common/pricing/pricing.module';
import { TaxModule } from './common/tax/tax.module';
import { DiscountsModule } from './common/discounts/discounts.module';
import { DashboardModule as FrontendDashboardModule } from './frontend/dashboard/dashboard.module';

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
        BrandsModule,
        CategoriesModule,
        GeneralSettingsModule,
        TaxGroupsModule,
        TaxesModule,
        MakingChargeDiscountsModule, // Important: Specific prefix before general prefix
        OffersModule,
        ProductsModule,
        QuotationsModule,
        AdminQuotationsModule,
        OrderStatusesModule, // Register before OrdersModule to avoid route conflicts
        OrdersModule,
        CartModule,
        PricingModule,
        TaxModule,
        DiscountsModule,
        FrontendDashboardModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
