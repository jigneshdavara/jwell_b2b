/**
 * Centralized type exports
 * Import types from here instead of defining in pages
 */

// Product types
export type {
    Product,
    ProductVariant,
    ProductMedia,
    SpotlightProduct,
} from './product';

// Order types
export type {
    Order,
    OrderListItem,
    OrderShowItem,
    OrderPayment,
} from './order';

// Quotation types
export type {
    Quotation,
    QuotationRow,
    QuotationItem,
} from './quotation';

// Catalog types
export type {
    CatalogFiltersInput,
    CatalogFilters,
    CatalogFacets,
    CatalogProps,
    PriceRange,
} from './catalog';

// Home page types
export type {
    HomePageProps,
    HomePageStats,
    HomePageFeature,
} from './home';

// Admin types
export type {
    AdminUser,
    BrandRow,
    MetalRow,
    CategoryRow,
    CategoryTreeNode,
    DiamondType,
    DiamondTypeRow,
    DiamondShapeRow,
    DiamondColorRow,
    DiamondClarityRow,
    DiamondClarity,
    DiamondShape,
} from './admin';

// Cart types
export type {
    CartItem,
    CartData,
    PriceBreakdown,
} from './cart';

// Order types (extended)
export type {
    OrderDetails,
} from './order';

// Checkout types
export type {
    CheckoutData,
} from './checkout';

// Wishlist types
export type {
    WishlistItem,
} from './wishlist';

// Dashboard types
export type {
    DashboardData,
} from './dashboard';

// KYC types
export type {
    KycDocument,
    KycProfile,
    ConversationMessage,
    KycUser,
} from './kyc';

// Product types (extended)
export type {
    ConfigMetal,
    ConfigDiamond,
    ConfigurationOption,
    ProductDetail,
} from './product';

// Invoice types
export type {
    Invoice,
    InvoiceStatus,
    InvoiceOrder,
    InvoiceUser,
    InvoiceOrderItem,
    InvoicePayment,
    InvoiceListItem,
    InvoiceListResponse,
} from './invoice';

