# Jwell B2B - Project Functionality Documentation

## Project Overview

**Jwell B2B** is a comprehensive B2B (Business-to-Business) jewelry e-commerce platform designed for manufacturers to sell jewelry products to retailers and wholesalers. The platform includes customer onboarding with KYC verification, product catalog management, dynamic pricing with live metal/diamond rates, quotation system, order management, and payment processing.

---

## Technology Stack

### Backend
- **Framework**: Laravel 12.x (PHP 8.2+)
- **Authentication**: Laravel Sanctum
- **Frontend Integration**: Inertia.js
- **Payment Gateway**: Stripe (with extensible gateway system)
- **Queue System**: Laravel Queues
- **Email Notifications**: Laravel Mail
- **Database**: MySQL/PostgreSQL (Laravel Eloquent ORM)

### Frontend
- **Framework**: React 18.x with TypeScript
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Headless UI
- **Build Tool**: Vite 7.x
- **Forms**: React Hook Form (implied from usage patterns)

---

## Application Architecture

The application is organized into three main portals:

1. **Customer Portal** (Frontend) - For retailers and wholesalers
2. **Admin Portal** - For administrators managing the platform
3. **Production Portal** - For production team to manage work orders

---

## Core Features & Functionality

### 1. User Management & Authentication

#### User Types (Enums)
- **Retailer**: B2B customers who buy in smaller quantities
- **Wholesaler**: B2B customers who buy in larger quantities
- **Admin**: Platform administrators
- **Super Admin**: Full system access
- **Sales**: Sales team members
- **Production**: Production team members

#### Authentication Flow
- Standard email/password registration and login
- OTP-based login support (`OtpLoginController`)
- Email verification required
- Password reset functionality
- Profile management with password updates

#### Customer Group Management
- Customers can be assigned to different groups
- Admin can create and manage customer groups
- Bulk group assignment functionality
- Customer types (Retailer/Wholesaler) management

---

### 2. KYC (Know Your Customer) Onboarding System

#### KYC Status Flow
- **Pending**: Initial status after registration
- **Review**: Status when admin is reviewing documents
- **Approved**: Customer can access full platform features
- **Rejected**: Access restricted, customer must resubmit

#### KYC Process
1. **Customer Onboarding** (`/onboarding/kyc`)
   - Business profile submission (business name, contact details, country)
   - Document upload (multiple document types supported)
   - Document management (upload, view, download, delete)
   - Messaging system for communication with compliance team
   - Real-time status updates

2. **Admin KYC Review** (`/admin/customers/{user}/kyc`)
   - View customer profile and documents
   - Approve/reject KYC status
   - Add internal notes
   - Update document status
   - Two-way messaging with customers
   - Comment preferences (enable/disable customer replies)

#### KYC Enforcement
- Middleware `EnsureKycApproved` blocks access to protected routes until KYC is approved
- Customers redirected to KYC onboarding page if not approved
- Full platform access only after approval

#### KYC Models
- `UserKycProfile`: Business information
- `UserKycDocument`: Uploaded documents with status tracking
- `UserKycMessage`: Communication between customer and admin

---

### 3. Product Catalog Management

#### Product Structure
- **Product**: Base product with SKU, name, description, brand, category
- **Product Variants**: Different configurations (size, metal, diamond combinations)
- **Product Media**: Multiple images per product
- **Brands**: Product brands with display order
- **Categories**: Hierarchical category system
- **Subcategories**: Nested categorization
- **Styles**: Product styling options
- **Sizes**: Available size options

#### Product Attributes
- Making charge calculation (fixed amount, percentage, or both)
- Base price (deprecated, pricing calculated dynamically)
- Metadata storage for flexible product information
- Active/inactive status
- Catalog assignment (products can belong to multiple catalogs)

#### Admin Product Management
- Full CRUD operations
- Bulk status updates
- Bulk deletion
- Product duplication/copy functionality
- Variant management with metals and diamonds
- Media upload and management

#### Product Variants
Each variant can have:
- **Metals**: Multiple metals with purity, tone, and weight
- **Diamonds**: Multiple diamonds with count, clarity, color, shape, size, type
- Custom configurations

---

### 4. Catalog Management

#### Catalog System
- Create product catalogs
- Assign products to catalogs
- Multiple catalogs support
- Bulk product assignment
- Catalog-based product visibility

---

### 5. Dynamic Pricing System

#### Price Components
The pricing service (`PricingService`) calculates prices based on:

1. **Metal Cost**
   - Uses live/current metal rates from `PriceRate` model
   - Considers metal type, purity, and weight
   - Formula: `metal_weight × price_per_gram`

2. **Diamond Cost**
   - Uses diamond prices from `Diamond` model
   - Multiplies price by diamond count
   - Formula: `diamond_price × count`

3. **Making Charge**
   - Fixed amount: Flat fee per product
   - Percentage: Percentage of metal cost
   - Both: Can combine fixed + percentage
   - Configurable per product

4. **Discounts**
   - Making charge discounts via `MakingChargeDiscountService`
   - User group-based discounts
   - Offer-based discounts via `OfferService`

5. **Taxes**
   - Tax groups and tax rules
   - Configurable tax calculations
   - Applied to final price

#### Price Calculation Formula
```
Unit Subtotal = Metal Cost + Diamond Cost + Making Charge
Line Subtotal = Unit Subtotal × Quantity
Discount Amount = Applied Discounts
Tax Amount = Tax on (Line Subtotal - Discount)
Final Price = Line Subtotal - Discount + Tax
```

#### Rate Management
- **Live Rate Sync**: Scheduled job to sync metal/diamond rates from external APIs
- **Manual Rate Entry**: Admin can manually update rates
- **Rate History**: Historical rate tracking via `PriceRate` model
- **Rate Locking**: Rates locked at order placement time
- **Metal Rate Types**: Gold, Silver, Platinum with different purities

---

### 6. Metal & Material Management

#### Metal Management
- Metal types (Gold, Silver, Platinum, etc.)
- Metal purities (22K, 24K, etc.)
- Metal tones (Yellow Gold, White Gold, Rose Gold, etc.)
- Bulk operations (create, update, delete)

#### Material Management
- Material types
- Material specifications
- Used in product configurations

---

### 7. Diamond Management

#### Diamond Attributes
- **Clarity**: Diamond clarity grades
- **Color**: Diamond color grades
- **Shape**: Round, Princess, etc.
- **Shape Sizes**: Size variations per shape
- **Type**: Natural, Lab-grown, etc.

#### Diamond Pricing
- Price stored per diamond
- Used in variant price calculations
- Admin can manage diamond catalog

---

### 8. Shopping Cart & Wishlist

#### Cart Functionality (`CartService`)
- Add products with variants to cart
- Update quantities
- Remove items
- Cart persists per user
- Price calculations reflect current rates

#### Wishlist Functionality (`WishlistService`)
- Add products to wishlist
- Remove from wishlist
- Move wishlist items to cart
- Product-based wishlist tracking

---

### 9. Quotation System

#### Quotation Flow
1. **Customer Creates Quotation**
   - From catalog product
   - From cart (multiple items)
   - With custom quantities and notes

2. **Admin Reviews & Manages**
   - View quotation details
   - Update product/variant
   - Add items to quotation
   - Approve or reject quotation
   - Request customer confirmation
   - Two-way messaging

3. **Customer Actions**
   - View quotation status
   - Confirm quotation (converts to order)
   - Decline quotation
   - Message admin

#### Quotation Features
- Status tracking
- Messaging system between customer and admin
- Product customization during review
- Group quotations support
- Metadata storage for custom information

---

### 10. Checkout & Order Management

#### Checkout Process (`CheckoutService`)
1. Cart review
2. Price confirmation with locked rates
3. Payment processing (Stripe integration)
4. Order creation
5. Payment confirmation

#### Order Status Flow (`OrderStatus` Enum)
- **Pending**: Order placed, awaiting approval
- **Pending Payment**: Payment required
- **Paid**: Payment completed
- **Approved**: Admin approved, ready for production
- **Awaiting Materials**: Waiting for materials
- **In Production**: Manufacturing in progress
- **Quality Check**: QC stage
- **Ready To Dispatch**: Ready for shipping
- **Dispatched**: Shipped to customer
- **Delivered**: Completed delivery
- **Cancelled**: Order cancelled
- **Payment Failed**: Payment processing failed

#### Order Features
- Status history tracking (`OrderStatusHistory`)
- Price breakdown with locked rates
- Multiple order items per order
- Payment tracking
- Customer order dashboard
- Admin order management

#### Order Workflow Service (`OrderWorkflowService`)
- Status transitions
- Audit trail maintenance
- Event emissions for notifications
- Workflow validation

---

### 11. Payment Processing

#### Payment Gateway System
- Extensible gateway architecture
- **Stripe Integration**: Full Stripe payment processing
- **Fake Gateway**: For testing/development
- Payment gateway manager pattern

#### Payment Flow
1. Order created with payment intent
2. Customer redirected to payment page
3. Stripe payment processing
4. Webhook handling for payment confirmation
5. Payment status updates
6. Order status updates based on payment

#### Payment Status (`PaymentStatus` Enum)
- **Pending**: Payment initiated
- **Requires Action**: Additional action needed (3D Secure, etc.)
- **Succeeded**: Payment successful
- **Failed**: Payment failed

#### Payment Features
- Multiple payment methods support
- Payment gateway configuration in admin settings
- Payment retry functionality
- Payment history tracking

---

### 12. Offer & Discount Management

#### Making Charge Discounts
- User group-based discounts
- Quantity-based discounts
- Percentage or fixed amount discounts
- Valid from/to date ranges
- Active/inactive status

#### Offers System
- General offer management
- Customer segment targeting
- Offer tracking and ROI monitoring

---

### 13. Admin Dashboard Features

#### Customer Management
- Customer list with filters
- KYC status management
- Customer group assignment
- Bulk operations
- Customer status toggle (active/inactive)
- Customer deletion

#### Product Management
- Product CRUD operations
- Variant management
- Media management
- Bulk operations
- Product catalog assignment

#### Order Management
- Order list with status filters
- Order detail view
- Status updates
- Order history tracking

#### Quotation Management
- Quotation list
- Quotation approval/rejection
- Product updates
- Messaging system

#### Settings Management
- **General Settings**: Platform-wide configuration
- **Payment Gateway Settings**: Payment configuration
- **Tax Groups**: Tax configuration
- **Tax Rules**: Individual tax settings
- **Rate Management**: Metal/diamond rate sync and manual entry

#### Team User Management
- Admin user creation
- Role assignment
- User group management
- Permission management

---

### 14. Production Portal

#### Production Dashboard
- Work order queues
- Production status tracking
- Stage management (Production → QC → Dispatch)

#### Production Features (Planned)
- Material issue/receipt logging
- Wastage tracking
- Dispatch details management

---

### 15. Notification System

#### Notification Service (`NotificationService`)
- Email notifications
- SMS notifications (stubbable)
- WhatsApp notifications (stubbable)
- Notification logs for audit trail

#### Notification Events
- `OrderConfirmed`: When order is confirmed
- `OrderStatusUpdated`: When order status changes
- Registration notifications
- KYC status updates

#### Notification Types
- Order confirmations
- Status updates
- Payment confirmations
- KYC approvals/rejections
- Quotation updates

---

### 16. Services & Business Logic

#### Core Services
1. **PricingService**: Product price calculations
2. **CartService**: Shopping cart operations
3. **CheckoutService**: Checkout and order creation
4. **OrderWorkflowService**: Order status management
5. **OfferService**: Discount and offer resolution
6. **MakingChargeDiscountService**: Making charge discount calculations
7. **RateSyncService**: Metal/diamond rate synchronization
8. **TaxService**: Tax calculations
9. **WishlistService**: Wishlist management
10. **NotificationService**: Notification dispatching

#### Product Variant Services
- **ProductVariantDimensionService**: Variant dimension calculations
- **ProductVariantSyncService**: Variant synchronization

---

### 17. Database Models

#### User Models
- `User` / `Customer`: Main user model with KYC status
- `UserGroup`: Customer grouping
- `UserKycProfile`: KYC business profile
- `UserKycDocument`: KYC documents
- `UserKycMessage`: KYC messaging
- `UserLoginOtp`: OTP login support

#### Product Models
- `Product`: Main product
- `ProductVariant`: Product variants
- `ProductVariantMetal`: Variant metal configurations
- `ProductVariantDiamond`: Variant diamond configurations
- `ProductMedia`: Product images
- `Brand`: Product brands
- `Category`: Product categories
- `Style`: Product styles
- `Size`: Product sizes

#### Catalog Models
- `Catalog`: Product catalogs
- `Material`: Materials
- `MaterialType`: Material types

#### Pricing Models
- `PriceRate`: Metal/diamond rates
- `Tax`: Tax rules
- `TaxGroup`: Tax groups
- `Offer`: Offers
- `MakingChargeDiscount`: Making charge discounts

#### Commerce Models
- `Cart`: Shopping carts
- `CartItem`: Cart items
- `Wishlist`: Wishlists
- `WishlistItem`: Wishlist items
- `Order`: Orders
- `OrderItem`: Order items
- `OrderStatus`: Order status definitions
- `OrderStatusHistory`: Order status audit trail

#### Quotation Models
- `Quotation`: Quotations
- `QuotationMessage`: Quotation messages

#### Payment Models
- `Payment`: Payment records
- `PaymentGateway`: Payment gateway configuration

#### Diamond Models
- `Diamond`: Diamond catalog
- `DiamondClarity`: Clarity grades
- `DiamondColor`: Color grades
- `DiamondShape`: Diamond shapes
- `DiamondShapeSize`: Shape sizes
- `DiamondType`: Diamond types

#### Metal Models
- `Metal`: Metal types
- `MetalPurity`: Metal purities
- `MetalTone`: Metal tones

#### Other Models
- `CustomerGroup`: Customer groups
- `CustomerType`: Customer types
- `Setting`: Application settings
- `NotificationLog`: Notification audit trail

---

### 18. Frontend Pages & Routes

#### Customer Portal Pages
- **Home**: Landing page with product showcase
- **Dashboard**: Customer dashboard with orders, quotations
- **Catalog**: Product catalog browsing
- **Product Detail**: Product view with price calculator
- **Cart**: Shopping cart management
- **Wishlist**: Wishlist management
- **Checkout**: Order checkout and payment
- **Orders**: Order list and detail views
- **Quotations**: Quotation list and detail views
- **KYC Onboarding**: KYC submission and tracking
- **Profile**: User profile management

#### Admin Portal Pages
- **Dashboard**: Admin overview
- **Customers**: Customer management
- **Products**: Product management
- **Orders**: Order management
- **Quotations**: Quotation management
- **Catalogs**: Catalog management
- **Brands**: Brand management
- **Categories**: Category management
- **Diamonds**: Diamond catalog management
- **Metals**: Metal management
- **Rates**: Rate management
- **Offers**: Offer management
- **Settings**: System settings
- **Team Users**: Admin user management

#### Production Portal Pages
- **Dashboard**: Production overview
- **Work Orders**: Work order management

---

### 19. Security & Permissions

#### Middleware
- `auth`: Authentication required
- `verified`: Email verification required
- `portal.customer`: Customer portal access
- `ensure.kyc.approved`: KYC approval required
- `auth:admin`: Admin authentication
- `can:access admin portal`: Admin permission check
- `can:update production status`: Production permission check

#### Route Protection
- Customer routes protected by KYC approval
- Admin routes protected by admin authentication and permissions
- Production routes protected by production permissions

---

### 20. Event System

#### Events
- `OrderConfirmed`: Fired when order is confirmed
- `OrderStatusUpdated`: Fired when order status changes

#### Listeners
- `SendOrderConfirmationEmail`: Sends order confirmation email
- `NotifyAdminOfNewOrder`: Notifies admin of new orders
- `NotifyAdminOfRegistration`: Notifies admin of new registrations
- `SendWelcomeEmail`: Sends welcome email to new users

---

### 21. Queue System

#### Queue Jobs
- Email notifications
- Rate synchronization
- Payment processing
- Background tasks

#### Queue Configuration
- Configurable queue driver
- Retry logic for failed jobs
- Job logging and monitoring

---

### 22. File Storage

#### Storage Structure
- KYC documents: `storage/app/public/kyc/{user_id}/`
- Product media: `storage/app/public/products/`
- General file uploads

#### Storage Configuration
- Public disk for accessible files
- Private disk for sensitive documents
- Cloud storage support (configurable)

---

## Key Workflows

### 1. Customer Registration & Onboarding
1. Customer registers with email/password
2. Email verification required
3. Redirected to KYC onboarding
4. Submit business profile and documents
5. Admin reviews and approves/rejects
6. Upon approval, customer gets full access

### 2. Product Purchase Flow
1. Browse catalog
2. View product details
3. Configure variant (metal, diamond, size)
4. Calculate price (real-time)
5. Add to cart or wishlist
6. Proceed to checkout
7. Confirm order and pay
8. Order created with locked rates
9. Payment processed
10. Order enters workflow

### 3. Quotation Flow
1. Customer creates quotation from product/cart
2. Admin reviews quotation
3. Admin may modify product/variant
4. Admin approves quotation
5. Customer confirms quotation
6. Quotation converts to order
7. Order enters normal purchase flow

### 4. Order Fulfillment Flow
1. Order placed (Pending)
2. Payment processed (Pending Payment → Paid)
3. Admin approves (Approved)
4. Production starts (In Production)
5. Quality check (Quality Check)
6. Ready to dispatch (Ready To Dispatch)
7. Dispatched (Dispatched)
8. Delivered (Delivered)

---

## API Endpoints

### Customer Routes
- `GET /`: Home page
- `GET /dashboard`: Customer dashboard
- `GET /catalog`: Product catalog
- `GET /catalog/{product}`: Product detail
- `POST /catalog/{product}/calculate-price`: Price calculation
- `GET /cart`: Cart view
- `POST /cart/items`: Add to cart
- `PATCH /cart/items/{item}`: Update cart item
- `DELETE /cart/items/{item}`: Remove from cart
- `GET /wishlist`: Wishlist view
- `POST /wishlist/items`: Add to wishlist
- `DELETE /wishlist/items/{item}`: Remove from wishlist
- `GET /checkout`: Checkout page
- `POST /checkout/confirm`: Confirm order
- `GET /orders`: Order list
- `GET /orders/{order}`: Order detail
- `GET /orders/{order}/pay`: Payment page
- `GET /quotations`: Quotation list
- `GET /quotations/{quotation}`: Quotation detail
- `POST /quotations`: Create quotation
- `POST /quotations/from-cart`: Create quotation from cart
- `POST /quotations/{quotation}/confirm`: Confirm quotation
- `POST /quotations/{quotation}/decline`: Decline quotation
- `GET /onboarding/kyc`: KYC onboarding page
- `PATCH /onboarding/kyc/profile`: Update KYC profile
- `POST /onboarding/kyc/documents`: Upload document
- `DELETE /onboarding/kyc/documents/{document}`: Delete document
- `GET /profile`: Profile edit
- `PATCH /profile`: Update profile

### Admin Routes (prefix: `/admin`)
- `GET /admin/dashboard`: Admin dashboard
- `GET /admin/customers`: Customer list
- `POST /admin/customers/{user}/kyc-status`: Update KYC status
- `GET /admin/customers/{user}/kyc`: KYC review
- `GET /admin/products`: Product list
- `POST /admin/products`: Create product
- `GET /admin/products/create`: Create product page
- `GET /admin/products/{product}/edit`: Edit product page
- `PUT /admin/products/{product}`: Update product
- `DELETE /admin/products/{product}`: Delete product
- `GET /admin/orders`: Order list
- `GET /admin/orders/{order}`: Order detail
- `POST /admin/orders/{order}/status`: Update order status
- `GET /admin/quotations`: Quotation list
- `GET /admin/quotations/{quotation}`: Quotation detail
- `POST /admin/quotations/{quotation}/approve`: Approve quotation
- `POST /admin/quotations/{quotation}/reject`: Reject quotation
- Many more admin routes for catalog, rates, settings, etc.

### Production Routes (prefix: `/production`)
- `GET /production/dashboard`: Production dashboard

---

## Configuration Files

### Key Config Files
- `config/app.php`: Application configuration
- `config/auth.php`: Authentication configuration
- `config/payments.php`: Payment gateway configuration
- `config/services.php`: Third-party service configurations
- `config/queue.php`: Queue configuration
- `config/mail.php`: Email configuration

---

## Database Migrations

The application includes 52+ database migrations covering:
- User tables and authentication
- KYC tables
- Product catalog tables
- Pricing and rate tables
- Order and quotation tables
- Payment tables
- Notification tables
- Settings tables

---

## Testing

### Test Structure
- Feature tests: `tests/Feature/`
- Unit tests: `tests/Unit/`
- Test factories: `database/factories/`

### Test Coverage Areas
- Authentication flows
- KYC processes
- Order workflows
- Pricing calculations
- Payment processing

---

## Development Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js & NPM
- MySQL/PostgreSQL
- Redis (optional, for queues)

### Setup Commands
```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm run build
```

### Development Server
```bash
composer run dev  # Starts server, queue, logs, and Vite concurrently
```

---

## Deployment Considerations

- Environment variables configuration
- Queue worker setup
- Cron jobs for rate synchronization
- File storage configuration
- Payment gateway webhook endpoints
- SSL/HTTPS for payment processing
- Database backups
- Log rotation

---

## Future Enhancements (Based on Architecture)

- ERP integration sync
- Advanced reporting and analytics
- Multi-language support
- Advanced jobwork management
- Material tracking system
- Advanced notification channels (SMS, WhatsApp)
- API for third-party integrations
- Mobile app support

---

## Conclusion

This B2B jewelry e-commerce platform provides a comprehensive solution for managing customer relationships, product catalogs, dynamic pricing, orders, quotations, and payments. The system is built with scalability, security, and user experience in mind, featuring role-based access control, KYC verification, and a flexible pricing engine that supports live market rates.

The modular architecture with services, events, and queues ensures maintainability and extensibility for future enhancements.

