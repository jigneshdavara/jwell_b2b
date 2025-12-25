import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { KycModule } from './kyc/kyc.module';
import { UsersModule } from './admin/users/users.module';
import { UserGroupsModule } from './admin/user-groups/user-groups.module';
import { UserTypesModule } from './admin/user-types/user-types.module';
import { DashboardModule } from './admin/dashboard/dashboard.module';
import { AdminGroupsModule } from './admin/admin-groups/admin-groups.module';
import { AdminsModule } from './admin/admins/admins.module';
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
import { CatalogsModule } from './admin/catalogs/catalogs.module';
import { GeneralSettingsModule } from './admin/settings/general/general.module';
import { TaxGroupsModule } from './admin/settings/tax-groups/tax-groups.module';
import { TaxesModule } from './admin/settings/taxes/taxes.module';
import { PaymentsSettingsModule } from './admin/settings/payments/payments.module';
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
import { CatalogModule } from './frontend/catalog/catalog.module';
import { WishlistModule } from './frontend/wishlist/wishlist.module';
import { FrontendCartModule } from './frontend/cart/cart.module';
import { FrontendQuotationsModule } from './frontend/quotations/quotations.module';
import { FrontendCheckoutModule } from './frontend/checkout/checkout.module';
import { FrontendOrdersModule } from './frontend/orders/orders.module';
import { HomeModule } from './frontend/home/home.module';
import { ProfileModule } from './frontend/profile/profile.module';
import { NavigationModule } from './frontend/navigation/navigation.module';
import { MailModule } from './common/mail/mail.module';

@Module({
    imports: [
        AuthModule,
        PrismaModule,
        MailModule,
        KycModule,
        UsersModule,
        UserGroupsModule,
        UserTypesModule,
        DashboardModule,
        AdminGroupsModule,
        AdminsModule,
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
        CatalogsModule,
        GeneralSettingsModule,
        TaxGroupsModule,
        TaxesModule,
        PaymentsSettingsModule,
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
        CatalogModule,
        WishlistModule,
        FrontendCartModule,
        FrontendQuotationsModule,
        FrontendCheckoutModule,
        FrontendOrdersModule,
        HomeModule,
        ProfileModule,
        NavigationModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
