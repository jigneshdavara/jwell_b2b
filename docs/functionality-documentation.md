# Jwell B2B Platform - Complete Functionality Documentation

## Table of Contents

1. [Application Overview](#application-overview)
2. [User Types & Portals](#user-types--portals)
3. [Authentication & User Management](#authentication--user-management)
4. [KYC Onboarding](#kyc-onboarding)
5. [Product Catalog Management](#product-catalog-management)
6. [Shopping Features](#shopping-features)
7. [Cart Management](#cart-management)
8. [Checkout & Payments](#checkout--payments)
9. [Order Management](#order-management)
10. [Quotation System](#quotation-system)
11. [Jobwork Requests](#jobwork-requests)
12. [Work Orders & Production](#work-orders--production)
13. [Pricing & Rates](#pricing--rates)
14. [Offers & Discounts](#offers--discounts)
15. [Customer Management](#customer-management)
16. [Admin Features](#admin-features)
17. [Settings & Configuration](#settings--configuration)
18. [Notifications & Events](#notifications--events)
19. [API Endpoints](#api-endpoints)

---

## Application Overview

**Jwell B2B** is a comprehensive B2B e-commerce platform for jewelry wholesale and manufacturing. Built with Laravel 12 and Inertia.js with React frontend, it enables retailers and wholesalers to browse catalogs, request quotations, place orders, and manage jobwork requests for custom manufacturing.

### Key Technologies
- **Backend**: Laravel 12, PHP 8.2+
- **Frontend**: React with Inertia.js
- **Database**: PostgreSQL (with migrations)
- **Payment**: Stripe integration with customizable gateway drivers
- **Authentication**: Laravel Breeze with OTP login support
- **File Storage**: Laravel Filesystem (local/S3 compatible)

---

## User Types & Portals

The application supports multiple user types with distinct portals:

### User Types (Enums)
1. **Retailer** - End customers who purchase products
2. **Wholesaler** - Bulk buyers with special pricing
3. **Admin** - Full administrative access
4. **Super Admin** - Highest level access
5. **Sales** - Sales team members
6. **Production** - Production department staff

### Portals

#### 1. **Customer Portal** (`/`)
- Public home page
- Registration and login
- KYC onboarding wizard
- Product catalog browsing
- Shopping cart and checkout
- Order management
- Quotation requests
- Jobwork submissions
- Wishlist management
- Dashboard with order history

#### 2. **Admin Portal** (`/admin`)
- Customer management and KYC approval
- Product and catalog management
- Order management and status updates
- Quotation approval and management
- User and team management
- Rate synchronization
- Offer and discount management
- Settings and configuration

#### 3. **Production Portal** (`/production`)
- Work order management
- Production status updates
- Quality check workflows
- Dispatch management

---

## Authentication & User Management

### Authentication Features

#### Login Methods
1. **Email/Password Login**
   - Traditional email and password authentication
   - Password reset via email
   - Email verification support

2. **OTP Login** (`/auth/otp`)
   - One-time password sent via email
   - OTP generation and validation
   - Time-based expiration

#### Registration
- Customer registration form
- Email verification required
- Automatic user type assignment (Retailer/Wholesaler)
- Welcome email sent upon registration
- Admin notification on new registration

#### Password Management
- Password reset via email link
- Password update from profile
- Password confirmation for sensitive actions

### User Profile Management
- Edit profile information
- Update password
- Delete account functionality
- Profile information display

---

## KYC Onboarding

### KYC Status Flow
- **Pending** - Initial status when user registers
- **Review** - Admin is reviewing documents
- **Approved** - KYC verified, full access granted
- **Rejected** - KYC rejected, requires resubmission

### KYC Features

#### Customer KYC Onboarding (`/onboarding/kyc`)
1. **Profile Information**
   - Business name, GST number, PAN
   - Contact information
   - Address details
   - Business type selection

2. **Document Upload**
   - Multiple document types supported
   - File upload with validation
   - Document download capability
   - Document deletion before approval

3. **Messaging System**
   - Customer can send messages to admin
   - Admin can request additional information
   - Thread-based communication

#### Admin KYC Management (`/admin/customers/{user}/kyc`)
- View customer KYC profile
- Review uploaded documents
- Approve or reject KYC
- Update document status
- Message customers
- Toggle comment preferences

### Access Control
- Customers with `pending` or `rejected` KYC cannot access:
  - Product catalog
  - Shopping cart
  - Checkout
  - Orders
  - Quotations (except viewing)

---

## Product Catalog Management

### Product Management (`/admin/products`)

#### Product CRUD Operations
- **Create** - Add new products with media
- **Read** - View product list and details
- **Update** - Edit product information
- **Delete** - Remove products
- **Bulk Operations**
  - Bulk status update
  - Bulk brand assignment
  - Bulk category assignment
  - Bulk deletion

#### Product Features
- **Product Information**
  - Name, SKU, description
  - Base price and making charges
  - Product variants (size, color, etc.)
  - Media gallery (multiple images)
  - Category and brand assignment
  - Material and purity information
  - Jobwork eligibility flag

- **Product Variants**
  - Multiple variants per product
  - Price adjustments per variant
  - Default variant selection
  - Variant-specific inventory (if applicable)

- **Product Status**
  - Active/Inactive status
  - Published/Draft states
  - Visibility control

#### Product Copy
- Duplicate existing products
- Copy with or without media

### Catalog Structure

#### Brands (`/admin/catalog/brands`)
- Create, update, delete brands
- Bulk deletion
- Brand assignment to products

#### Categories (`/admin/catalog/categories`)
- Hierarchical category structure
- Create, update, delete categories
- Bulk operations

#### Product Catalogs (`/admin/catalog/product-catalogs`)
- Group products into catalogs
- Assign products to catalogs
- Catalog-based product organization

#### Materials (`/admin/catalog/materials`)
- Material type definitions (Gold, Silver, etc.)
- Material specifications
- Purity information

#### Material Types (`/admin/catalog/material-types`)
- Categorize materials
- Material classification

### Diamond Attributes

#### Diamond Shapes (`/admin/diamond/shapes`)
- Shape definitions (Round, Princess, etc.)
- Manage diamond shapes

#### Diamond Colors (`/admin/diamond/colors`)
- Color grading (D, E, F, etc.)
- Color management

#### Diamond Clarities (`/admin/diamond/clarities`)
- Clarity grades (FL, IF, VVS1, etc.)
- Clarity management

#### Diamond Types (`/admin/diamond/types`)
- Natural, lab-grown, etc.
- Type management

### Metal Purity Management

#### Gold Purity (`/admin/gold/purities`)
- 24K, 22K, 18K, 14K management
- Purity-specific pricing

#### Silver Purity (`/admin/silver/purities`)
- 999, 958, 925 purity management
- Silver-specific configurations

### Customer Portal Catalog (`/catalog`)

#### Product Browsing
- Browse all active products
- Filter by category, brand, material
- Search functionality
- Product detail pages
- Image gallery view
- Variant selection

#### Product Details (`/catalog/{product}`)
- Full product information
- Variant selection
- Add to cart
- Add to wishlist
- Request quotation
- Jobwork request (if eligible)

---

## Shopping Features

### Wishlist Management (`/wishlist`)

#### Features
- View wishlist items
- Add products to wishlist
- Remove items from wishlist
- Move items from wishlist to cart
- Delete by product

#### Wishlist Functionality
- Persistent across sessions
- User-specific wishlists
- Product with variant support

---

## Cart Management

### Shopping Cart (`/cart`)

#### Cart Operations
1. **Add to Cart**
   - Add products with variants
   - Quantity selection
   - Selections (custom options)
   - Notes per item

2. **Update Cart Items**
   - Modify quantity
   - Update configuration
   - Change variant selection

3. **Remove Items**
   - Delete individual items
   - Clear entire cart

#### Cart Features
- **Price Calculation**
  - Base price + making charges
  - Variant price adjustments
  - Discount calculations (making charge discounts)
  - Customer group pricing
  - Real-time price updates

- **Cart Modes**
  - **Purchase Mode**: Standard product purchase
  - **Jobwork Mode**: Custom manufacturing request

- **Configuration Support**
  - Notes and special instructions
  - Product-specific options

#### Cart Summary
- Subtotal calculation
- Discount summary
- Tax calculation (if applicable)
- Grand total
- Item count

---

## Checkout & Payments

### Checkout Process (`/checkout`)

#### Checkout Flow
1. **Cart Review**
   - Review cart items
   - Verify pricing
   - Check quantities

2. **Order Initialization**
   - Create or update order
   - Lock prices (rate locking)
   - Generate order reference

3. **Payment Setup**
   - Initialize payment intent
   - Configure payment gateway
   - Generate payment reference

4. **Payment Processing**
   - Stripe integration
   - Card payment processing
   - Payment status tracking

#### Checkout Features
- Order creation from cart
- Price locking at checkout time
- Multiple payment attempts
- Payment retry for failed payments
- Order confirmation emails

### Payment Gateways

#### Supported Gateways
1. **Stripe** (`StripeGateway`)
   - Full Stripe integration
   - Payment intents API
   - Card payments
   - Payment status retrieval

2. **Fake Gateway** (`FakeGateway`)
   - Development/testing gateway
   - Mock payment processing

#### Payment Gateway Management (`/admin/settings/payments`)
- Configure payment gateways
- Set active gateway
- Configure gateway credentials
- Test gateway connections

#### Payment Status Flow
- **Pending** - Payment not yet initiated
- **Requires Action** - Additional authentication needed
- **Succeeded** - Payment completed
- **Failed** - Payment failed

### Payment Retry (`/orders/{order}/pay`)
- Retry failed payments
- Reinitialize payment intent
- Update payment information

---

## Order Management

### Order Status Flow

#### Status Enumeration
1. **Pending** - Order created, awaiting approval
2. **Pending Payment** - Awaiting payment
3. **Paid** - Payment received
4. **Payment Failed** - Payment processing failed
5. **Approved** - Admin approved order
6. **Awaiting Materials** - Waiting for raw materials
7. **In Production** - Manufacturing in progress
8. **Quality Check** - Quality assurance stage
9. **Ready To Dispatch** - Production complete
10. **Dispatched** - Order shipped
11. **Delivered** - Order delivered
12. **Cancelled** - Order cancelled

### Customer Order Management (`/orders`)

#### Features
- View order history
- Order details page
- Order status tracking
- Order status history
- Download invoices (if implemented)
- Reorder functionality
- Payment retry for unpaid orders

#### Order Details (`/orders/{order}`)
- Full order information
- Itemized product list
- Price breakdown
- Payment information
- Status history timeline
- Delivery tracking (if applicable)

### Admin Order Management (`/admin/orders`)

#### Features
- View all orders
- Filter by status, customer, date
- Order details view
- Status updates
- Order approval/rejection
- Bulk operations (if implemented)

#### Order Status Updates (`/admin/orders/{order}/status`)
- Update order status
- Add status change notes
- Automatic notifications
- Status history tracking

#### Order Workflow Service
- Automated status transitions
- Business rule enforcement
- Audit trail maintenance
- Event triggering

### Order Events
- **OrderConfirmed** - Fired when order is confirmed
- **OrderStatusUpdated** - Fired on status changes

---

## Quotation System

### Quotation Types

#### Purchase Quotations
- Standard product purchase quotes
- Price inquiry for catalog products
- Custom quantity requests

#### Jobwork Quotations
- Custom manufacturing quotes
- Customer-supplied materials
- Vendor-supplied materials

### Customer Quotation Management (`/quotations`)

#### Create Quotation

1. **From Product** (`/quotations` POST)
   - Select product and variant
   - Specify quantity
   - Add notes

2. **From Cart** (`/quotations/from-cart` POST)
   - Convert entire cart to quotations
   - Batch quotation creation
   - Preserve cart configurations

#### Quotation Features
- View quotation list
- Quotation details (`/quotations/{quotation}`)
- Status tracking
- Message thread with admin
- Confirm quotation (convert to order)
- Decline quotation
- Delete quotation

#### Quotation Status Flow
- **Pending** - Submitted, awaiting admin review
- **Approved** - Admin approved with pricing
- **Rejected** - Admin rejected
- **Confirmed** - Customer confirmed (converted to order)
- **Declined** - Customer declined

### Admin Quotation Management (`/admin/quotations`)

#### Quotation Views
- **All Quotations** - Complete list
- **Jewellery Quotations** - Purchase quotations
- **Jobwork Quotations** - Manufacturing quotations

#### Admin Actions
1. **Approve Quotation** (`/admin/quotations/{quotation}/approve`)
   - Set approved pricing
   - Add admin notes
   - Update product details
   - Send approval email

2. **Reject Quotation** (`/admin/quotations/{quotation}/reject`)
   - Reject with reason
   - Send rejection email

3. **Update Product** (`/admin/quotations/{quotation}/update-product`)
   - Modify product details
   - Update pricing
   - Change specifications

4. **Jobwork Status Update** (`/admin/quotations/{quotation}/jobwork-status`)
   - Update jobwork-specific status
   - Track manufacturing progress

5. **Request Customer Confirmation** (`/admin/quotations/{quotation}/request-confirmation`)
   - Request customer approval
   - Send confirmation request email

6. **Messages** (`/admin/quotations/{quotation}/messages`)
   - Respond to customer queries
   - Add internal notes
   - Thread-based communication

### Quotation Messages
- Customer-admin communication
- Thread-based messaging
- Email notifications
- Message history

---

## Jobwork Requests

### Jobwork Types

1. **Customer Supplied** (`customer_supplied`)
   - Customer provides materials
   - Manufacturing charges apply
   - Wastage calculation

2. **Vendor Supplied** (`vendor_supplied`)
   - Vendor provides materials
   - Material cost included
   - Full pricing quote

### Jobwork Submission (`/jobwork`)

#### Submission Modes

1. **Catalogue Mode**
   - Select from existing products
   - Use product as base design
   - Customize specifications

2. **Custom Mode**
   - Create completely custom design
   - No product reference
   - Full specification input

#### Jobwork Request Information
  - Product selection
  - Variant selection

- **Design Reference**
  - Reference design description
  - Reference URL
  - Reference media (images)

- **Material Specifications**
  - Metal type (Gold, Silver, etc.)
  - Purity (24K, 22K, etc.)
  - Diamond quality (if applicable)

- **Production Details**
  - Quantity
  - Delivery deadline
  - Special instructions
  - Wastage percentage
  - Manufacturing charge

#### Jobwork Status Flow
- **Submitted** - Request submitted
- **Approved** - Admin approved
- **In Progress** - Manufacturing started
- **Completed** - Jobwork finished
- **Cancelled** - Request cancelled

### Jobwork Management
- View jobwork history
- Track status updates
- View admin responses
- Download work orders (when generated)

---

## Work Orders & Production

### Work Order Model

#### Work Order Status Flow
1. **Draft** - Initial creation
2. **In Production** - Manufacturing active
3. **Quality Check** - QC stage
4. **Ready To Dispatch** - Production complete
5. **Dispatched** - Shipped to customer
6. **Closed** - Order completed

### Work Order Generation
- Created from approved orders
- Created from approved jobwork requests
- Links to parent order/jobwork

### Production Portal (`/production`)

#### Production Dashboard
- Overview of active work orders
- Status summary
- Pending QC items
- Dispatch queue

#### Work Order Management (`/production/work-orders`)
- View all work orders
- Filter by status
- Work order details

#### Status Updates (`/production/work-orders/{workOrder}/status`)
- Update production status
- Mark QC complete
- Mark ready for dispatch
- Update dispatch information

### Work Order Features
- Production tracking
- Quality check workflow
- Material tracking (if implemented)
- Dispatch management
- Audit trail

---

## Pricing & Rates

### Pricing Service

#### Price Calculation Components
1. **Base Price** - Product base price
2. **Making Charges** - Manufacturing cost
3. **Variant Adjustments** - Variant-specific pricing
4. **Discounts** - Making charge discounts
5. **Taxes** - Tax calculations (if applicable)

#### Price Breakdown
- Unit base price
- Unit making charge
- Unit discount
- Unit total
- Line subtotal (quantity × unit total)
- Total discount
- Total amount

### Rate Management (`/admin/rates`)

#### Rate Synchronization
- **Live Rate Sync** (`/admin/rates/sync`)
  - Fetch live metal rates from external API
  - Support for Gold (XAU) and Silver (XAG)
  - Purity-based rate calculation
  - Manual sync trigger

- **Manual Rate Entry** (`/admin/rates/{metal}/store`)
  - Manual rate override
  - Rate locking for orders
  - Historical rate tracking

#### Supported Metals
- **Gold (XAU)**
  - Purity multipliers: 24K, 22K, 18K, 14K
  - Troy ounce to gram conversion

- **Silver (XAG)**
  - Purity multipliers: 999, 958, 925
  - Troy ounce to gram conversion

#### Rate Features
- Real-time rate fetching
- Rate history
- Rate locking at checkout
- Purity-based calculations
- API integration for live rates

### Rate Sync Service
- External API integration
- Automatic rate fetching
- Fallback mechanisms
- Error handling and logging
- Scheduled synchronization support

### API Rate Endpoint (`/api/rates`)
- Authenticated rate access
- Current rates for customers
- Rate information for pricing

---

## Offers & Discounts

### Offer Management (`/admin/offers`)

#### Offer Types
- Percentage discounts
- Fixed amount discounts
- Conditional offers
- Customer group-specific offers

#### Offer Features
- Create, update, delete offers
- Offer code management
- Validity periods
- Customer eligibility rules
- Product/category restrictions

### Making Charge Discounts (`/admin/offers/making-charge-discounts`)

#### Discount Rules
- Customer group-based discounts
- Quantity-based discounts
- Product-specific discounts
- Percentage or fixed amount

#### Discount Service
- Automatic discount calculation
- Priority-based discount application
- Maximum discount limits
- Discount validation

#### Discount Features
- Bulk operations (bulk delete)
- Multiple discount rules
- Rule priority management
- Discount history

---

## Customer Management

### Customer Types (`/admin/customers/types`)
- Define customer classifications
- Type-specific pricing
- Access control by type

### Customer Groups (`/admin/customers/groups`)
- Group customers for bulk operations
- Group-specific pricing
- Discount rules by group
- Bulk group assignment

### Customer Management (`/admin/customers`)

#### Customer Operations
- View customer list
- Filter and search customers
- View customer details
- KYC status management
- Toggle customer status (active/inactive)
- Bulk operations:
  - Bulk delete
  - Bulk group update

#### Customer Actions
- **Update KYC Status** - Approve/reject KYC
- **Toggle Status** - Activate/deactivate account
- **Update Group** - Assign to customer group
- **Delete Customer** - Remove customer account
- **View KYC** - Access KYC documents and profile

---

## Admin Features

### Admin Dashboard (`/admin/dashboard`)
- Overview statistics
- Recent orders
- Pending KYC requests
- Pending quotations
- Active work orders

### User & Team Management (`/admin/users`)

#### Team User Management
- Create admin/sales users
- Update user information
- Assign user groups
- Deactivate users
- Bulk delete users
- Bulk group updates

#### User Groups (`/admin/users/groups`)
- Create user groups
- Assign permissions
- Group-based access control
- Bulk operations

### Product Management
- Full CRUD operations
- Bulk operations
- Media management
- Variant management
- Product catalog assignment

### Order Management
- View all orders
- Status updates
- Order approval
- Order cancellation
- Order details and history

### Quotation Management
- Approve/reject quotations
- Update pricing
- Message customers
- Jobwork status tracking
- Request confirmations

---

## Settings & Configuration

### General Settings (`/admin/settings/general`)
- Application settings
- Business information
- Default configurations
- System preferences

### Tax Management

#### Tax Groups (`/admin/settings/tax-groups`)
- Create tax groups
- Assign multiple taxes
- Group-based tax application

#### Taxes (`/admin/settings/taxes`)
- Tax rate definitions
- Tax type management
- Percentage-based taxes

### Payment Gateway Settings (`/admin/settings/payments`)
- Configure payment gateways
- Set active gateway
- Gateway credentials
- Test connections

### Order Status Management (`/admin/orders/statuses`)
- Define custom order statuses
- Status workflow configuration
- Bulk operations

---

## Notifications & Events

### Event System

#### Events
1. **OrderConfirmed**
   - Triggered when order is confirmed
   - Contains order and payment information
   - Triggers email notifications

2. **OrderStatusUpdated**
   - Triggered on order status changes
   - Contains order, new status, and metadata
   - Enables status-based notifications

3. **Registered** (Laravel default)
   - User registration event
   - Triggers welcome emails
   - Admin notifications

### Event Listeners

1. **SendOrderConfirmationEmail**
   - Sends confirmation to customer
   - Includes order details
   - Payment information

2. **NotifyAdminOfNewOrder**
   - Notifies admin of new order
   - Order summary email
   - Admin dashboard update

3. **SendWelcomeEmail**
   - Welcome email to new customers
   - Account information
   - Next steps guidance

4. **NotifyAdminOfRegistration**
   - Admin notification of new registration
   - Customer information
   - KYC reminder

### Email Notifications

#### Customer Emails
- Welcome email
- Order confirmation
- Order status updates
- Quotation submitted confirmation
- Quotation approved/rejected
- Quotation status updates
- Login OTP

#### Admin Emails
- New user registration
- New order notification
- Quotation submitted
- KYC submission notification

### Notification Service
- Email dispatch
- SMS support (if configured)
- WhatsApp support (if configured)
- Notification logging
- Retry mechanisms

---

## API Endpoints

### Public API (`/api`)

#### Rate API (`/api/rates`)
- **GET** `/api/rates`
  - Get current metal rates
  - Requires authentication
  - Returns rate information

---

## Additional Features

### Search & Filtering
- Product search
- Category filtering
- Brand filtering
- Material filtering
- Price range filtering

### File Management
- Product image uploads
- Document storage (KYC)
- Reference media (jobwork)
- File download capabilities

### Audit Trails
- Order status history
- KYC status changes
- Quotation status tracking
- Work order updates

### Bulk Operations
- Bulk product updates
- Bulk customer operations
- Bulk group assignments
- Bulk deletions

### Data Export
- Order exports (if implemented)
- Customer exports (if implemented)
- Report generation (if implemented)

---

## Security Features

### Access Control
- Role-based access control (RBAC)
- Permission gates
- Portal-specific access
- KYC-gated features

### Authentication Security
- Email verification
- Password hashing
- OTP expiration
- Session management

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

---

## Technical Architecture

### Backend Services

1. **CartService**
   - Cart management
   - Item operations
   - Price calculations

2. **PricingService**
   - Price calculations
   - Discount application
   - Tax calculations

3. **CheckoutService**
   - Order creation
   - Payment initialization
   - Checkout workflow

4. **OrderWorkflowService**
   - Status transitions
   - Business rule enforcement
   - Audit trail

5. **RateSyncService**
   - External API integration
   - Rate fetching
   - Rate storage

6. **OfferService**
   - Offer resolution
   - Discount calculation
   - Offer application

7. **MakingChargeDiscountService**
   - Discount rule evaluation
   - Discount calculation
   - Rule prioritization

8. **PaymentGatewayManager**
   - Gateway selection
   - Driver management
   - Payment processing

9. **NotificationService**
   - Email dispatch
   - Notification logging
   - Retry mechanisms

10. **WishlistService**
    - Wishlist management
    - Item operations

11. **ProductVariantSyncService**
    - Variant management
    - Product updates

### Database Models

#### Core Models
- User, Customer
- Product, ProductVariant, ProductMedia, ProductCatalog
- Cart, CartItem
- Order, OrderItem, OrderStatus, OrderStatusHistory
- Payment, PaymentGateway
- Quotation, QuotationMessage
- JobworkRequest
- Wishlist, WishlistItem

#### Catalog Models
- Brand, Category
- Material, MaterialType
- DiamondShape, DiamondColor, DiamondClarity, DiamondCut, DiamondType
- GoldPurity, SilverPurity

#### Configuration Models
- CustomerType, CustomerGroup
- UserGroup
- Tax, TaxGroup
- Offer, MakingChargeDiscount
- PriceRate
- Setting

#### KYC Models
- UserKycProfile
- UserKycDocument
- UserKycMessage

#### Notification Models
- NotificationLog
- UserLoginOtp

---

## Workflows

### Order Workflow
1. Customer adds items to cart
2. Customer proceeds to checkout
3. Order created with "Pending" status
4. Payment initialized
5. Payment processed
6. Order status → "Pending Payment" or "Paid"
7. Admin reviews and approves → "Approved"
8. Materials check → "Awaiting Materials" (if needed)
9. Production starts → "In Production"
10. QC stage → "Quality Check"
11. Ready for dispatch → "Ready To Dispatch"
12. Shipped → "Dispatched"
13. Delivered → "Delivered"

### Quotation Workflow
1. Customer submits quotation
2. Status: "Pending"
3. Admin reviews quotation
4. Admin approves/rejects → "Approved" or "Rejected"
5. Customer confirms → "Confirmed" (converted to order)
6. Or customer declines → "Declined"

### KYC Workflow
1. Customer registers
2. KYC status: "Pending"
3. Customer completes profile
4. Customer uploads documents
5. Admin reviews → "Review"
6. Admin approves/rejects → "Approved" or "Rejected"
7. Approved customers get full access

### Jobwork Workflow
1. Customer submits jobwork request
2. Status: "Submitted"
3. Admin reviews and approves → "Approved"
4. Work order created
5. Production starts → "In Progress"
6. Completion → "Completed"

---

## Future Enhancements (Planned)

- Advanced reporting and analytics
- Inventory management
- Multi-currency support
- Advanced search with Elasticsearch
- Mobile app APIs
- Advanced discount rules engine
- Loyalty program
- Referral system
- Live chat support
- Video consultation booking
- Advanced shipping integrations
- Invoice generation
- Credit limit management
- Payment terms and credit sales

---

## Conclusion

This B2B jewelry platform provides a comprehensive solution for wholesale and manufacturing operations, with robust features for catalog management, order processing, quotations, jobwork requests, and production tracking. The multi-portal architecture ensures appropriate access levels for different user types, while the event-driven notification system keeps all stakeholders informed.

The platform is built with scalability in mind, using modern Laravel practices and a React frontend for optimal performance and user experience.

