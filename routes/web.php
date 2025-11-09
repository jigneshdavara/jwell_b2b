<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\KycController;
use App\Http\Controllers\Admin\OfferController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\PaymentGatewayController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\RateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\MaterialController;
use App\Http\Controllers\Frontend\CartController;
use App\Http\Controllers\Frontend\CatalogController;
use App\Http\Controllers\Frontend\CheckoutController;
use App\Http\Controllers\Frontend\DashboardController as FrontendDashboardController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\JobworkController;
use App\Http\Controllers\Frontend\KycOnboardingController;
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
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'verified', 'can:access admin portal'])
    ->group(function () {
        Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');

        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users/{user}/kyc-status', [UserController::class, 'updateKycStatus'])
            ->name('users.update-kyc');
        Route::get('/users/{user}/kyc', [KycController::class, 'show'])->name('users.kyc.show');
        Route::put('/users/kyc-documents/{document}', [KycController::class, 'updateDocument'])->name('users.kyc.documents.update');

        Route::post('products/bulk/status', [ProductController::class, 'bulkStatus'])->name('products.bulk-status');
        Route::post('products/bulk/brand', [ProductController::class, 'bulkAssignBrand'])->name('products.bulk-brand');
        Route::post('products/bulk/category', [ProductController::class, 'bulkAssignCategory'])->name('products.bulk-category');
        Route::delete('products/bulk', [ProductController::class, 'bulkDestroy'])->name('products.bulk-destroy');
        Route::post('products/{product}/copy', [ProductController::class, 'copy'])->name('products.copy');
        Route::resource('products', ProductController::class)->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        Route::delete('catalog/brands/bulk', [BrandController::class, 'bulkDestroy'])->name('catalog.brands.bulk-destroy');
        Route::resource('catalog/brands', BrandController::class)->only(['index', 'store', 'update', 'destroy'])->names('catalog.brands');
        Route::delete('catalog/categories/bulk', [CategoryController::class, 'bulkDestroy'])->name('catalog.categories.bulk-destroy');
        Route::resource('catalog/categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy'])->names('catalog.categories');
        Route::resource('catalog/materials', MaterialController::class)->only(['index', 'store', 'update', 'destroy'])->names('catalog.materials');

        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
        Route::post('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');

        Route::get('/offers', [OfferController::class, 'index'])->name('offers.index');
        Route::post('/offers', [OfferController::class, 'store'])->name('offers.store');
        Route::put('/offers/{offer}', [OfferController::class, 'update'])->name('offers.update');
        Route::delete('/offers/{offer}', [OfferController::class, 'destroy'])->name('offers.destroy');

        Route::get('/rates', [RateController::class, 'index'])->name('rates.index');
        Route::post('/rates/sync', [RateController::class, 'sync'])->name('rates.sync');
        Route::post('/rates/override', [RateController::class, 'storeOverride'])->name('rates.override');

        Route::get('/settings/payments', [PaymentGatewayController::class, 'edit'])->name('settings.payments.edit');
        Route::put('/settings/payments', [PaymentGatewayController::class, 'update'])->name('settings.payments.update');
    });

Route::prefix('production')
    ->name('production.')
    ->middleware(['auth', 'verified', 'can:update production status'])
    ->group(function () {
        Route::get('/dashboard', ProductionDashboardController::class)->name('dashboard');
        Route::get('/work-orders', [WorkOrderController::class, 'index'])->name('work-orders.index');
        Route::post('/work-orders/{workOrder}/status', [WorkOrderController::class, 'updateStatus'])
            ->name('work-orders.update-status');
    });


require __DIR__.'/auth.php';
