<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\KycController;
use App\Http\Controllers\Admin\OfferController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\MakingChargeDiscountController;
use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\RateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserGroupController;
use App\Http\Controllers\Admin\TeamUserController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\MaterialController;
use App\Http\Controllers\Admin\MaterialTypeController;
use App\Http\Controllers\Admin\ProductCatalogController;
use App\Http\Controllers\Admin\DiamondShapeController;
use App\Http\Controllers\Admin\DiamondColorController;
use App\Http\Controllers\Admin\DiamondClarityController;
use App\Http\Controllers\Admin\DiamondCutController;
use App\Http\Controllers\Admin\DiamondTypeController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\MetalController;
use App\Http\Controllers\Admin\MetalToneController;
use App\Http\Controllers\Admin\MetalPurityController;
use App\Http\Controllers\Admin\CustomerTypeController;
use App\Http\Controllers\Admin\CustomerGroupController;
use App\Http\Controllers\Admin\OrderStatusController;
use App\Http\Controllers\Admin\QuotationController as AdminQuotationController;
use App\Http\Controllers\Frontend\CartController;
use App\Http\Controllers\Frontend\CatalogController;
use App\Http\Controllers\Frontend\CheckoutController;
use App\Http\Controllers\Frontend\DashboardController as FrontendDashboardController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\JobworkController;
use App\Http\Controllers\Frontend\QuotationController;
use App\Http\Controllers\Frontend\OrderController as FrontendOrderController;
use App\Http\Controllers\Frontend\KycOnboardingController;
use App\Http\Controllers\Frontend\WishlistController;
use App\Http\Controllers\Production\DashboardController as ProductionDashboardController;
use App\Http\Controllers\Production\WorkOrderController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/onboarding/kyc', [KycOnboardingController::class, 'show'])->name('onboarding.kyc.show');
    Route::patch('/onboarding/kyc/profile', [KycOnboardingController::class, 'updateProfile'])->name('onboarding.kyc.profile.update');
    Route::post('/onboarding/kyc/documents', [KycOnboardingController::class, 'storeDocument'])->name('onboarding.kyc.documents.store');
    Route::delete('/onboarding/kyc/documents/{document}', [KycOnboardingController::class, 'destroyDocument'])->name('onboarding.kyc.documents.destroy');
    Route::get('/onboarding/kyc/documents/{document}/download', [KycOnboardingController::class, 'downloadDocument'])->name('onboarding.kyc.documents.download');
    Route::post('/onboarding/kyc/messages', [KycOnboardingController::class, 'storeMessage'])->name('onboarding.kyc.messages.store');

    Route::middleware(['portal.customer'])->group(function () {
        Route::get('/dashboard', FrontendDashboardController::class)
            ->middleware('ensure.kyc.approved')
            ->name('dashboard');

        Route::get('/catalog', [CatalogController::class, 'index'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.catalog.index');

        Route::get('/catalog/{product}', [CatalogController::class, 'show'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.catalog.show');

        Route::get('/cart', [CartController::class, 'index'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.cart.index');
        Route::post('/cart/items', [CartController::class, 'store'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.cart.items.store');
        Route::patch('/cart/items/{item}', [CartController::class, 'update'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.cart.items.update');
        Route::delete('/cart/items/{item}', [CartController::class, 'destroy'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.cart.items.destroy');
        Route::get('/wishlist', [WishlistController::class, 'index'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.wishlist.index');
        Route::post('/wishlist/items', [WishlistController::class, 'store'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.wishlist.items.store');
        Route::delete('/wishlist/items/{item}', [WishlistController::class, 'destroy'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.wishlist.items.destroy');
        Route::post('/wishlist/items/{item}/move-to-cart', [WishlistController::class, 'addToCart'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.wishlist.items.move-to-cart');
        Route::delete('/wishlist/product/{product}', [WishlistController::class, 'destroyByProduct'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.wishlist.items.destroy-by-product');

        Route::get('/checkout', [CheckoutController::class, 'show'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.checkout.show');
        Route::post('/checkout/confirm', [CheckoutController::class, 'confirm'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.checkout.confirm');

        Route::get('/jobwork', [JobworkController::class, 'index'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.jobwork.index');

        Route::post('/jobwork', [JobworkController::class, 'store'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.jobwork.store');

        Route::get('/orders', [FrontendOrderController::class, 'index'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.orders.index');
        Route::get('/orders/{order}/pay', [CheckoutController::class, 'payOrder'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.orders.pay');
        Route::get('/orders/{order}', [FrontendOrderController::class, 'show'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.orders.show');

        Route::get('/quotations', [QuotationController::class, 'index'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.quotations.index');
        Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.quotations.show');
        Route::post('/quotations', [QuotationController::class, 'store'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.quotations.store');
        Route::post('/quotations/from-cart', [QuotationController::class, 'storeFromCart'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.quotations.store-from-cart');
        Route::delete('/quotations/{quotation}', [QuotationController::class, 'destroy'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.quotations.destroy');
        Route::post('/quotations/{quotation}/messages', [QuotationController::class, 'message'])
            ->middleware('ensure.kyc.approved')
            ->name('frontend.quotations.messages.store');
        Route::post('/quotations/{quotation}/confirm', [QuotationController::class, 'confirm'])->name('frontend.quotations.confirm');
        Route::post('/quotations/{quotation}/decline', [QuotationController::class, 'decline'])->name('frontend.quotations.decline');
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth:admin', 'can:access admin portal'])
    ->group(function () {
        Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');

        Route::get('/customers', [UserController::class, 'index'])->name('customers.index');
        Route::post('/customers/{user}/kyc-status', [UserController::class, 'updateKycStatus'])
            ->name('customers.update-kyc');
        Route::post('/customers/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('customers.toggle-status');
        Route::get('/customers/{user}/kyc', [KycController::class, 'show'])->name('customers.kyc.show');
        Route::put('/customers/kyc-documents/{document}', [KycController::class, 'updateDocument'])->name('customers.kyc.documents.update');
        Route::post('/customers/{user}/kyc/messages', [KycController::class, 'storeMessage'])->name('customers.kyc.messages.store');
        Route::post('/customers/{user}/kyc/comments-preference', [KycController::class, 'updateCommentsSetting'])->name('customers.kyc.comments.update');
        Route::patch('/customers/{user}/group', [UserController::class, 'updateGroup'])->name('customers.group.update');
        Route::delete('/customers/{user}', [UserController::class, 'destroy'])->name('customers.destroy');
        Route::delete('/customers/bulk', [UserController::class, 'bulkDestroy'])->name('customers.bulk-destroy');
        Route::post('/customers/bulk/group', [UserController::class, 'bulkGroupUpdate'])->name('customers.bulk-group-update');

        Route::post('products/bulk/status', [ProductController::class, 'bulkStatus'])->name('products.bulk-status');
        Route::post('products/bulk/brand', [ProductController::class, 'bulkAssignBrand'])->name('products.bulk-brand');
        Route::post('products/bulk/category', [ProductController::class, 'bulkAssignCategory'])->name('products.bulk-category');
        Route::delete('products/bulk', [ProductController::class, 'bulkDestroy'])->name('products.bulk-destroy');
        Route::post('products/{product}/copy', [ProductController::class, 'copy'])->name('products.copy');
        Route::resource('products', ProductController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::delete('catalog/categories/bulk', [CategoryController::class, 'bulkDestroy'])->name('catalog.categories.bulk-destroy');
        Route::resource('catalog/categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy'])->names('catalog.categories');
        Route::delete('catalog/product-catalogs/bulk', [ProductCatalogController::class, 'bulkDestroy'])->name('catalog.product-catalogs.bulk-destroy');
        Route::post('catalog/product-catalogs/{product_catalog}/assign-products', [ProductCatalogController::class, 'assignProducts'])->name('catalog.product-catalogs.assign-products');
        Route::resource('catalog/product-catalogs', ProductCatalogController::class)->only(['index', 'store', 'update', 'destroy'])->names('catalog.product-catalogs');
        Route::delete('catalog/materials/bulk', [MaterialController::class, 'bulkDestroy'])->name('catalog.materials.bulk-destroy');
        Route::resource('catalog/materials', MaterialController::class)->only(['index', 'store', 'update', 'destroy'])->names('catalog.materials');

        Route::delete('catalog/material-types/bulk', [MaterialTypeController::class, 'bulkDestroy'])->name('catalog.material-types.bulk-destroy');
        Route::resource('catalog/material-types', MaterialTypeController::class)->only(['index', 'store', 'update', 'destroy'])->names('catalog.material-types');

        Route::prefix('diamond')->name('diamond.')->group(function () {
            Route::delete('shapes/bulk', [DiamondShapeController::class, 'bulkDestroy'])->name('shapes.bulk-destroy');
            Route::resource('shapes', DiamondShapeController::class)->only(['index', 'store', 'update', 'destroy'])->names('shapes');

            Route::delete('colors/bulk', [DiamondColorController::class, 'bulkDestroy'])->name('colors.bulk-destroy');
            Route::resource('colors', DiamondColorController::class)->only(['index', 'store', 'update', 'destroy'])->names('colors');

            Route::delete('clarities/bulk', [DiamondClarityController::class, 'bulkDestroy'])->name('clarities.bulk-destroy');
            Route::resource('clarities', DiamondClarityController::class)->only(['index', 'store', 'update', 'destroy'])->names('clarities');

            Route::delete('cuts/bulk', [DiamondCutController::class, 'bulkDestroy'])->name('cuts.bulk-destroy');
            Route::resource('cuts', DiamondCutController::class)->only(['index', 'store', 'update', 'destroy'])->names('cuts');

            Route::delete('types/bulk', [DiamondTypeController::class, 'bulkDestroy'])->name('types.bulk-destroy');
            Route::resource('types', DiamondTypeController::class)->only(['index', 'store', 'update', 'destroy'])->names('types');
        });

        Route::delete('metals/bulk', [MetalController::class, 'bulkDestroy'])->name('metals.bulk-destroy');
        Route::resource('metals', MetalController::class)->only(['index', 'store', 'update', 'destroy'])->names('metals');

        Route::delete('brands/bulk', [BrandController::class, 'bulkDestroy'])->name('brands.bulk-destroy');
        Route::resource('brands', BrandController::class)->only(['index', 'store', 'update', 'destroy'])->names('brands');

        Route::delete('metal-tones/bulk', [MetalToneController::class, 'bulkDestroy'])->name('metal-tones.bulk-destroy');
        Route::resource('metal-tones', MetalToneController::class)->only(['index', 'store', 'update', 'destroy'])->names('metal-tones');

        Route::delete('metal-purities/bulk', [MetalPurityController::class, 'bulkDestroy'])->name('metal-purities.bulk-destroy');
        Route::resource('metal-purities', MetalPurityController::class)->only(['index', 'store', 'update', 'destroy'])->names('metal-purities');


        Route::prefix('orders')->name('orders.')->group(function () {
            Route::delete('statuses/bulk', [OrderStatusController::class, 'bulkDestroy'])->name('statuses.bulk-destroy');
            Route::resource('statuses', OrderStatusController::class)->only(['index', 'store', 'update', 'destroy'])->names('statuses');
        });

        Route::delete('users/groups/bulk', [UserGroupController::class, 'bulkDestroy'])->name('users.groups.bulk-destroy');
        Route::resource('users/groups', UserGroupController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->names('users.groups');
        Route::get('/users', [TeamUserController::class, 'index'])->name('users.index');
        Route::post('/users', [TeamUserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}', [TeamUserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [TeamUserController::class, 'destroy'])->name('users.destroy');
        Route::delete('/users/bulk', [TeamUserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
        Route::patch('/users/{user}/group', [TeamUserController::class, 'updateGroup'])->name('users.group.update');

        Route::prefix('customers')->name('customers.')->group(function () {
            Route::delete('types/bulk', [CustomerTypeController::class, 'bulkDestroy'])->name('types.bulk-destroy');
            Route::resource('types', CustomerTypeController::class)->only(['index', 'store', 'update', 'destroy'])->names('types');

            Route::delete('groups/bulk', [CustomerGroupController::class, 'bulkDestroy'])->name('groups.bulk-destroy');
            Route::resource('groups', CustomerGroupController::class)->only(['index', 'store', 'update', 'destroy'])->names('groups');
        });

        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::post('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');

        Route::get('/quotations', [AdminQuotationController::class, 'index'])->name('quotations.index');
        Route::get('/quotations/jewellery', [AdminQuotationController::class, 'index'])->name('quotations.jewellery')->defaults('mode', 'purchase');
        Route::get('/quotations/jobwork', [AdminQuotationController::class, 'index'])->name('quotations.jobwork')->defaults('mode', 'jobwork');
        Route::get('/quotations/{quotation}', [AdminQuotationController::class, 'show'])->name('quotations.show');
        Route::post('/quotations/{quotation}/approve', [AdminQuotationController::class, 'approve'])->name('quotations.approve');
        Route::post('/quotations/{quotation}/reject', [AdminQuotationController::class, 'reject'])->name('quotations.reject');
        Route::post('/quotations/{quotation}/jobwork-status', [AdminQuotationController::class, 'updateJobworkStatus'])->name('quotations.jobwork-status');
        Route::post('/quotations/{quotation}/messages', [AdminQuotationController::class, 'message'])->name('quotations.messages.store');
        Route::post('/quotations/{quotation}/request-confirmation', [AdminQuotationController::class, 'requestCustomerConfirmation'])->name('quotations.request-confirmation');
        Route::post('/quotations/{quotation}/update-product', [AdminQuotationController::class, 'updateProduct'])->name('quotations.update-product');
        Route::delete('/quotations/{quotation}', [AdminQuotationController::class, 'destroy'])->name('quotations.destroy');

        Route::get('/offers', [OfferController::class, 'index'])->name('offers.index');
        Route::post('/offers', [OfferController::class, 'store'])->name('offers.store');
        Route::put('/offers/{offer}', [OfferController::class, 'update'])->name('offers.update');
        Route::delete('/offers/{offer}', [OfferController::class, 'destroy'])->name('offers.destroy');

        Route::delete('offers/making-charge-discounts/bulk', [MakingChargeDiscountController::class, 'bulkDestroy'])
            ->name('offers.making-charge-discounts.bulk-destroy');
        Route::resource('offers/making-charge-discounts', MakingChargeDiscountController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->names('offers.making-charge-discounts');

        Route::get('/rates', [RateController::class, 'index'])->name('rates.index');
        Route::post('/rates/sync/{metal?}', [RateController::class, 'sync'])->name('rates.sync');
        Route::post('/rates/{metal}/store', [RateController::class, 'storeMetal'])->name('rates.metal.store');

        Route::prefix('settings')->name('settings.')->group(function () {
            Route::get('/general', [\App\Http\Controllers\Admin\Settings\GeneralSettingsController::class, 'index'])->name('general.index');
            Route::put('/general', [\App\Http\Controllers\Admin\Settings\GeneralSettingsController::class, 'update'])->name('general.update');

            Route::resource('tax-groups', \App\Http\Controllers\Admin\Settings\TaxGroupController::class)->only(['index', 'store', 'update', 'destroy'])->names('tax-groups');
            Route::resource('taxes', \App\Http\Controllers\Admin\Settings\TaxController::class)->only(['index', 'store', 'update', 'destroy'])->names('taxes');

            Route::get('/payments', [PaymentGatewayController::class, 'edit'])->name('payments.edit');
            Route::put('/payments', [PaymentGatewayController::class, 'update'])->name('payments.update');
        });
    });

Route::prefix('production')
    ->name('production.')
    ->middleware(['auth:admin', 'can:update production status'])
    ->group(function () {
        Route::get('/dashboard', ProductionDashboardController::class)->name('dashboard');
        Route::get('/work-orders', [WorkOrderController::class, 'index'])->name('work-orders.index');
        Route::post('/work-orders/{workOrder}/status', [WorkOrderController::class, 'updateStatus'])
            ->name('work-orders.update-status');
    });


require __DIR__ . '/auth.php';
