## B2B Manufacturing Platform Architecture

### 1. High-Level Portals

- **Public/Customer Portal** (`routes/web.php` with `Frontend` controllers, Vue/React SPA components under `resources/js/frontend`):
  - Guest pages (home, brands, contact, live-rate teaser).
  - Registration + KYC upload wizard.
  - Catalogue browsing, cart, checkout, jobwork request submission.
  - Customer dashboard (orders, jobwork, offers, notifications, profile).
- **Admin Portal** (`routes/web.php` admin prefix, controllers under `App\Http\Controllers\Admin`):
  - KYC approval, user segmentation, product/brand management.
  - Pricing rules, live rate overrides, order workflow management.
  - Jobwork approvals, work order generation, notifications, reporting.
- **Production Ops Portal** (`routes/web.php` production prefix, controllers under `App\Http\Controllers\Production`):
  - Work order queues, stage updates (Production -> QC -> Dispatch).
  - Material issue/receipt logging, wastage tracking, dispatch details.

All portals consume shared application services and models.

### 2. Backend Application Layers

- **Models (`app/Models`)**
  - `User`, `UserKycDocument`, `Brand`, `Category`, `Material`, `Product`, `ProductMedia`
  - `PriceRate`, `Offer`, `Cart`, `CartItem`, `Order`, `OrderItem`
- **Services (`app/Services`)**
  - `PricingService`: computes metal + diamond + making + offers.
  - `OfferService`: resolves applicable discounts and price locks.
  - `RateSyncService`: integrates with external rate APIs / manual overrides.
  - `OrderWorkflowService`: transitions order & work order statuses, audits changes.
  - `NotificationService`: dispatches email/SMS/WhatsApp (stubbable).
- **Actions (`app/Actions`)**: encapsulate one-off tasks (e.g., ApproveKyc, CreateJobworkWorkOrder).
- **Policies & Gates (`app/Policies`)**: enforce role-based permissions for portals.
- **Enums (`app/Enums`)**: centralize status constants (KYC status, order status, jobwork type).
- **Repositories (optional, per need)**: wrap complex query logic if services require.

### 3. Database Schema (Migrations & Seeders)

- Users table extended with `type`, `kyc_status`, `preferred_language`, `credit_limit`.
- KYC documents table storing metadata + storage paths.
- Product dimension tables: brands, categories, materials/purities.
- `price_rates` capturing live/locked rates with source attribution.
- Commerce tables: carts, orders, order_items with price lock details.
- Jobwork tables: requests, supplied materials, work orders, audit trails.
- Notification logs for audit + resend capabilities.

Seeders bootstrap reference data (brands, categories, materials, demo products, offers).

### 4. Frontend Technology Stack

- Laravel Vite with **React** (preferred) or Vue; use Bootstrap for styling.
- Entry points:
  - `resources/js/frontend/app.tsx` for customer portal SPA.
  - `resources/js/admin/app.tsx` for admin dashboard.
  - `resources/js/production/app.tsx` for production ops.
- Shared UI library under `resources/js/ui` for components (tables, forms, modals).
- Localization via Laravel JSON lang files mirrored in frontend (e.g., using i18n library).

### 5. Routing Strategy

- `routes/web.php`: grouped routes with middleware:
  - `Route::prefix('admin')->middleware(['auth', 'role:admin|super-admin'])`
  - `Route::prefix('production')->middleware(['auth', 'role:production|super-admin'])`
  - Customer routes under `Route::middleware(['auth', 'role:retailer|wholesaler'])`
- `routes/api.php`: JSON endpoints for SPA interactions (secured with Sanctum).
- Custom middleware for `EnsureKycApproved` to gate full access.

### 6. Workflow & Status Handling

- Status enums:
  - KYC: `pending`, `approved`, `rejected`.
  - Order: `pending`, `approved`, `in_production`, `qc`, `ready_to_dispatch`, `dispatched`, `delivered`.
  - Jobwork: `submitted`, `approved`, `in_progress`, `completed`, `cancelled`.
- Order workflow actions emit domain events (e.g., `OrderStatusUpdated`) consumed for notifications/logging.
- Work orders linked either to orders or jobwork requests; maintain audit tables for transitions.

### 7. Integration Layer

- Scheduled command (`app/Console/Commands/SyncPriceRates`) to fetch live metal/diamond rates.
- `RateSyncService` stores fallback values and triggers alerts if API fails.
- Future ERP sync: `erp_sync_records` table + queue jobs to process updates.

### 8. Testing & Tooling

- Feature tests per portal (authentication, KYC, order flow).
- Service tests for pricing, offers, workflow transitions.
- Factories for core models to support testing and seed data.
- Utilize Laravel Pint and PHPUnit as provided to maintain code quality.

This blueprint guides subsequent implementation phases while honoring the established coding rules.

