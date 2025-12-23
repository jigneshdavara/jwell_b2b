-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "email_verified_at" TIMESTAMPTZ(0),
    "password" VARCHAR(191) NOT NULL,
    "type" VARCHAR(191) NOT NULL DEFAULT 'admin',
    "user_group_id" BIGINT,
    "remember_token" VARCHAR(100),
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "email_verified_at" TIMESTAMPTZ(0),
    "password" VARCHAR(191) NOT NULL,
    "phone" VARCHAR(191),
    "type" VARCHAR(191) NOT NULL DEFAULT 'retailer',
    "customer_group_id" BIGINT,
    "kyc_status" VARCHAR(191) NOT NULL DEFAULT 'pending',
    "kyc_notes" TEXT,
    "preferred_language" VARCHAR(191),
    "credit_limit" DECIMAL(12,2) DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "remember_token" VARCHAR(100),
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),
    "kyc_comments_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_kyc_profiles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "business_name" VARCHAR(191) NOT NULL,
    "business_website" VARCHAR(191),
    "gst_number" VARCHAR(191),
    "pan_number" VARCHAR(191),
    "registration_number" VARCHAR(191),
    "address_line1" VARCHAR(191),
    "address_line2" VARCHAR(191),
    "city" VARCHAR(191),
    "state" VARCHAR(191),
    "postal_code" VARCHAR(191),
    "country" VARCHAR(191) NOT NULL DEFAULT 'India',
    "contact_name" VARCHAR(191),
    "contact_phone" VARCHAR(191),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "user_kyc_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_login_otps" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "expires_at" TIMESTAMPTZ(0) NOT NULL,
    "consumed_at" TIMESTAMPTZ(0),
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "user_login_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cover_image" VARCHAR(191),
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cache" (
    "key" VARCHAR(191) NOT NULL,
    "value" TEXT NOT NULL,
    "expiration" INTEGER NOT NULL,

    CONSTRAINT "cache_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "cache_locks" (
    "key" VARCHAR(191) NOT NULL,
    "owner" VARCHAR(191) NOT NULL,
    "expiration" INTEGER NOT NULL,

    CONSTRAINT "cache_locks_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" BIGSERIAL NOT NULL,
    "cart_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "configuration" JSONB,
    "price_breakdown" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),
    "product_variant_id" BIGINT,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "status" VARCHAR(191) NOT NULL DEFAULT 'active',
    "currency" VARCHAR(191) NOT NULL DEFAULT 'INR',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_products" (
    "id" BIGSERIAL NOT NULL,
    "catalog_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogs" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT,
    "code" VARCHAR(191),
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cover_image" VARCHAR(191),
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_sizes" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "size_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT now(),
    "updated_at" TIMESTAMP(0) DEFAULT now(),

    CONSTRAINT "category_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_styles" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "style_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(0) DEFAULT now(),
    "updated_at" TIMESTAMP(0) DEFAULT now(),

    CONSTRAINT "category_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_groups" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "customer_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_types" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "customer_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diamond_clarities" (
    "id" BIGSERIAL NOT NULL,
    "diamond_type_id" BIGINT NOT NULL,
    "code" VARCHAR(191),
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "diamond_clarities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diamond_colors" (
    "id" BIGSERIAL NOT NULL,
    "diamond_type_id" BIGINT NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "diamond_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diamond_shape_sizes" (
    "id" BIGSERIAL NOT NULL,
    "diamond_type_id" BIGINT NOT NULL,
    "diamond_shape_id" BIGINT NOT NULL,
    "size" VARCHAR(191) NOT NULL,
    "secondary_size" VARCHAR(191),
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "ctw" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "diamond_shape_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diamond_shapes" (
    "id" BIGSERIAL NOT NULL,
    "diamond_type_id" BIGINT NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "diamond_shapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diamond_types" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(0) DEFAULT now(),
    "updated_at" TIMESTAMP(0) DEFAULT now(),

    CONSTRAINT "diamond_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diamonds" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "diamond_type_id" BIGINT NOT NULL,
    "diamond_clarity_id" BIGINT NOT NULL,
    "diamond_color_id" BIGINT NOT NULL,
    "diamond_shape_id" BIGINT NOT NULL,
    "diamond_shape_size_id" BIGINT NOT NULL,
    "weight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "diamonds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failed_jobs" (
    "id" BIGSERIAL NOT NULL,
    "uuid" VARCHAR(191) NOT NULL,
    "connection" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "exception" TEXT NOT NULL,
    "failed_at" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failed_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_batches" (
    "id" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "total_jobs" INTEGER NOT NULL,
    "pending_jobs" INTEGER NOT NULL,
    "failed_jobs" INTEGER NOT NULL,
    "failed_job_ids" TEXT NOT NULL,
    "options" TEXT,
    "cancelled_at" INTEGER,
    "created_at" INTEGER NOT NULL,
    "finished_at" INTEGER,

    CONSTRAINT "job_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" BIGSERIAL NOT NULL,
    "queue" VARCHAR(191) NOT NULL,
    "payload" TEXT NOT NULL,
    "attempts" SMALLINT NOT NULL,
    "reserved_at" INTEGER,
    "available_at" INTEGER NOT NULL,
    "created_at" INTEGER NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "making_charge_discounts" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" VARCHAR(191),
    "discount_type" VARCHAR(255) NOT NULL DEFAULT 'percentage',
    "value" DECIMAL(10,2) NOT NULL,
    "brand_id" BIGINT,
    "category_id" BIGINT,
    "customer_group_id" BIGINT,
    "min_cart_total" DECIMAL(12,2),
    "is_auto" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMPTZ(0),
    "ends_at" TIMESTAMPTZ(0),
    "customer_types" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "making_charge_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_purities" (
    "id" BIGSERIAL NOT NULL,
    "metal_id" BIGINT NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "metal_purities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_tones" (
    "id" BIGSERIAL NOT NULL,
    "metal_id" BIGINT NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "metal_tones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metals" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "metals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- CreateTable
CREATE TABLE "notification_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "channel" VARCHAR(191) NOT NULL,
    "template" VARCHAR(191) NOT NULL,
    "payload" JSONB,
    "sent_at" TIMESTAMPTZ(0),
    "status" VARCHAR(191) NOT NULL DEFAULT 'queued',
    "response" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(191) NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "constraints" JSONB,
    "starts_at" TIMESTAMPTZ(0),
    "ends_at" TIMESTAMPTZ(0),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT,
    "sku" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "configuration" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_histories" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "status" VARCHAR(191) NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "order_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_statuses" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "color" VARCHAR(191) NOT NULL DEFAULT '#64748b',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "order_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "status" VARCHAR(191) NOT NULL DEFAULT 'pending',
    "reference" VARCHAR(191) NOT NULL,
    "currency" VARCHAR(191) NOT NULL DEFAULT 'INR',
    "subtotal_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "price_breakdown" JSONB,
    "locked_rates" JSONB,
    "status_meta" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "email" VARCHAR(191) NOT NULL,
    "token" VARCHAR(191) NOT NULL,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "payment_gateways" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "driver" VARCHAR(191) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "payment_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "payment_gateway_id" BIGINT NOT NULL,
    "provider_reference" VARCHAR(191) NOT NULL,
    "status" VARCHAR(191) NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rates" (
    "id" BIGSERIAL NOT NULL,
    "metal" VARCHAR(191) NOT NULL,
    "purity" VARCHAR(191),
    "price_per_gram" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(191) NOT NULL DEFAULT 'INR',
    "source" VARCHAR(191) NOT NULL DEFAULT 'manual',
    "effective_at" TIMESTAMPTZ(0),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "price_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_medias" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "type" VARCHAR(191) NOT NULL DEFAULT 'image',
    "url" VARCHAR(191) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "product_medias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_diamonds" (
    "id" BIGSERIAL NOT NULL,
    "product_variant_id" BIGINT NOT NULL,
    "diamond_id" BIGINT,
    "diamonds_count" INTEGER,
    "metadata" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "product_variant_diamonds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_metals" (
    "id" BIGSERIAL NOT NULL,
    "product_variant_id" BIGINT NOT NULL,
    "metal_id" BIGINT NOT NULL,
    "metal_purity_id" BIGINT,
    "metal_tone_id" BIGINT,
    "metal_weight" DECIMAL(10,3),
    "metadata" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "product_variant_metals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "sku" VARCHAR(191),
    "label" VARCHAR(191) NOT NULL,
    "size_id" BIGINT,
    "inventory_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "titleline" VARCHAR(191),
    "brand_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "subcategory_ids" JSONB,
    "style_ids" JSONB,
    "collection" VARCHAR(191),
    "producttype" VARCHAR(191),
    "gender" VARCHAR(191),
    "sku" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "making_charge_amount" DECIMAL(12,2),
    "making_charge_percentage" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_messages" (
    "id" BIGSERIAL NOT NULL,
    "quotation_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "sender" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "quotation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "quotation_group_id" VARCHAR(191),
    "product_id" BIGINT NOT NULL,
    "product_variant_id" BIGINT,
    "status" VARCHAR(191) NOT NULL DEFAULT 'pending',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "metadata" JSONB,
    "order_id" BIGINT,
    "approved_at" TIMESTAMPTZ(0),
    "admin_notes" TEXT,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" VARCHAR(191) NOT NULL,
    "user_id" BIGINT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "payload" TEXT NOT NULL,
    "last_activity" INTEGER NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(191) NOT NULL,
    "value" TEXT,
    "type" VARCHAR(191) NOT NULL DEFAULT 'string',
    "group" VARCHAR(191) NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sizes" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(191),
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "styles" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(191),
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_groups" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "tax_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" BIGSERIAL NOT NULL,
    "tax_group_id" BIGINT NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "code" VARCHAR(191) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_kyc_documents" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(191) NOT NULL,
    "file_path" VARCHAR(191) NOT NULL,
    "status" VARCHAR(191) NOT NULL DEFAULT 'pending',
    "remarks" VARCHAR(191),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "user_kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_kyc_messages" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "admin_id" BIGINT,
    "sender_type" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "user_kyc_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" BIGSERIAL NOT NULL,
    "wishlist_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "product_variant_id" BIGINT,
    "configuration" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "name" VARCHAR(191) NOT NULL DEFAULT 'Primary',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT now(),
    "updated_at" TIMESTAMPTZ(0) DEFAULT now(),

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_unique" ON "customers"("email");

-- CreateIndex
CREATE INDEX "brands_code_index" ON "brands"("code");

-- CreateIndex
CREATE INDEX "brands_display_order_index" ON "brands"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_product_unique" ON "catalog_products"("catalog_id", "product_id");

-- CreateIndex
CREATE INDEX "catalogs_code_index" ON "catalogs"("code");

-- CreateIndex
CREATE INDEX "catalogs_display_order_index" ON "catalogs"("display_order");

-- CreateIndex
CREATE INDEX "categories_code_index" ON "categories"("code");

-- CreateIndex
CREATE INDEX "categories_display_order_index" ON "categories"("display_order");

-- CreateIndex
CREATE INDEX "categories_parent_id_index" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "category_sizes_category_id_index" ON "category_sizes"("category_id");

-- CreateIndex
CREATE INDEX "category_sizes_size_id_index" ON "category_sizes"("size_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_sizes_category_id_size_id_unique" ON "category_sizes"("category_id", "size_id");

-- CreateIndex
CREATE INDEX "category_styles_category_id_index" ON "category_styles"("category_id");

-- CreateIndex
CREATE INDEX "category_styles_style_id_index" ON "category_styles"("style_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_styles_category_id_style_id_unique" ON "category_styles"("category_id", "style_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_groups_name_unique" ON "customer_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customer_groups_code_unique" ON "customer_groups"("code");


-- CreateIndex
CREATE UNIQUE INDEX "customer_types_name_unique" ON "customer_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customer_types_code_unique" ON "customer_types"("code");

-- CreateIndex
CREATE INDEX "diamond_clarities_code_index" ON "diamond_clarities"("code");

-- CreateIndex
CREATE INDEX "diamond_clarities_display_order_index" ON "diamond_clarities"("display_order");

-- CreateIndex
CREATE INDEX "diamond_colors_code_index" ON "diamond_colors"("code");

-- CreateIndex
CREATE INDEX "diamond_colors_display_order_index" ON "diamond_colors"("display_order");

-- CreateIndex
CREATE INDEX "diamond_shape_sizes_diamond_shape_id_display_order_index" ON "diamond_shape_sizes"("diamond_shape_id", "display_order");

-- CreateIndex
CREATE INDEX "diamond_shapes_code_index" ON "diamond_shapes"("code");

-- CreateIndex
CREATE INDEX "diamond_shapes_display_order_index" ON "diamond_shapes"("display_order");

-- CreateIndex
CREATE INDEX "diamond_types_code_index" ON "diamond_types"("code");

-- CreateIndex
CREATE INDEX "diamond_types_display_order_index" ON "diamond_types"("display_order");

-- CreateIndex
CREATE INDEX "diamonds_diamond_clarity_id_diamond_color_id_diamond_shape_id_i" ON "diamonds"("diamond_clarity_id", "diamond_color_id", "diamond_shape_id");

-- CreateIndex
CREATE INDEX "diamonds_is_active_index" ON "diamonds"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" ON "failed_jobs"("uuid");

-- CreateIndex
CREATE INDEX "jobs_queue_index" ON "jobs"("queue");

-- CreateIndex
CREATE INDEX "making_charge_discounts_is_active_starts_at_ends_at_index" ON "making_charge_discounts"("is_active", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "metal_purities_code_index" ON "metal_purities"("code");

-- CreateIndex
CREATE INDEX "metal_purities_display_order_index" ON "metal_purities"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "metal_purities_metal_id_name_unique" ON "metal_purities"("metal_id", "name");

-- CreateIndex
CREATE INDEX "metal_tones_code_index" ON "metal_tones"("code");

-- CreateIndex
CREATE INDEX "metal_tones_display_order_index" ON "metal_tones"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "metal_tones_metal_id_name_unique" ON "metal_tones"("metal_id", "name");

-- CreateIndex
CREATE INDEX "metals_code_index" ON "metals"("code");

-- CreateIndex
CREATE INDEX "metals_display_order_index" ON "metals"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "offers_code_unique" ON "offers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "order_statuses_name_unique" ON "order_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "order_statuses_slug_unique" ON "order_statuses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "orders_reference_unique" ON "orders"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateways_slug_unique" ON "payment_gateways"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_reference_unique" ON "payments"("provider_reference");

-- CreateIndex
CREATE INDEX "product_variant_diamonds_product_variant_id_index" ON "product_variant_diamonds"("product_variant_id");

-- CreateIndex
CREATE INDEX "product_variant_metals_product_variant_id_metal_id_index" ON "product_variant_metals"("product_variant_id", "metal_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_unique" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_unique" ON "products"("sku");

-- CreateIndex
CREATE INDEX "quotations_quotation_group_id_index" ON "quotations"("quotation_group_id");

-- CreateIndex
CREATE INDEX "sessions_last_activity_index" ON "sessions"("last_activity");

-- CreateIndex
CREATE INDEX "sessions_user_id_index" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_unique" ON "settings"("key");

-- CreateIndex
CREATE INDEX "sizes_code_index" ON "sizes"("code");

-- CreateIndex
CREATE INDEX "sizes_display_order_index" ON "sizes"("display_order");

-- CreateIndex
CREATE INDEX "styles_code_index" ON "styles"("code");

-- CreateIndex
CREATE INDEX "styles_display_order_index" ON "styles"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "taxes_code_unique" ON "taxes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_name_unique" ON "user_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_slug_unique" ON "user_groups"("slug");

-- CreateIndex
CREATE INDEX "user_groups_is_active_position_index" ON "user_groups"("is_active", "position");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_item_unique" ON "wishlist_items"("wishlist_id", "product_id", "product_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_customer_id_unique" ON "wishlists"("customer_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_user_group_id_foreign" FOREIGN KEY ("user_group_id") REFERENCES "user_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_customer_group_id_foreign" FOREIGN KEY ("customer_group_id") REFERENCES "customer_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_kyc_profiles" ADD CONSTRAINT "user_kyc_profiles_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_login_otps" ADD CONSTRAINT "user_login_otps_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_foreign" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_variant_id_foreign" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_catalog_id_foreign" FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_sizes" ADD CONSTRAINT "category_sizes_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_sizes" ADD CONSTRAINT "category_sizes_size_id_foreign" FOREIGN KEY ("size_id") REFERENCES "sizes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_styles" ADD CONSTRAINT "category_styles_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "category_styles" ADD CONSTRAINT "category_styles_style_id_foreign" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamond_clarities" ADD CONSTRAINT "diamond_clarities_diamond_type_id_foreign" FOREIGN KEY ("diamond_type_id") REFERENCES "diamond_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamond_colors" ADD CONSTRAINT "diamond_colors_diamond_type_id_foreign" FOREIGN KEY ("diamond_type_id") REFERENCES "diamond_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamond_shape_sizes" ADD CONSTRAINT "diamond_shape_sizes_diamond_shape_id_foreign" FOREIGN KEY ("diamond_shape_id") REFERENCES "diamond_shapes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamond_shape_sizes" ADD CONSTRAINT "diamond_shape_sizes_diamond_type_id_foreign" FOREIGN KEY ("diamond_type_id") REFERENCES "diamond_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamond_shapes" ADD CONSTRAINT "diamond_shapes_diamond_type_id_foreign" FOREIGN KEY ("diamond_type_id") REFERENCES "diamond_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamonds" ADD CONSTRAINT "diamonds_diamond_clarity_id_foreign" FOREIGN KEY ("diamond_clarity_id") REFERENCES "diamond_clarities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamonds" ADD CONSTRAINT "diamonds_diamond_color_id_foreign" FOREIGN KEY ("diamond_color_id") REFERENCES "diamond_colors"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamonds" ADD CONSTRAINT "diamonds_diamond_shape_id_foreign" FOREIGN KEY ("diamond_shape_id") REFERENCES "diamond_shapes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamonds" ADD CONSTRAINT "diamonds_diamond_shape_size_id_foreign" FOREIGN KEY ("diamond_shape_size_id") REFERENCES "diamond_shape_sizes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diamonds" ADD CONSTRAINT "diamonds_diamond_type_id_foreign" FOREIGN KEY ("diamond_type_id") REFERENCES "diamond_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "making_charge_discounts" ADD CONSTRAINT "making_charge_discounts_brand_id_foreign" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "making_charge_discounts" ADD CONSTRAINT "making_charge_discounts_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "making_charge_discounts" ADD CONSTRAINT "making_charge_discounts_customer_group_id_foreign" FOREIGN KEY ("customer_group_id") REFERENCES "customer_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metal_purities" ADD CONSTRAINT "metal_purities_metal_id_foreign" FOREIGN KEY ("metal_id") REFERENCES "metals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "metal_tones" ADD CONSTRAINT "metal_tones_metal_id_foreign" FOREIGN KEY ("metal_id") REFERENCES "metals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_status_histories" ADD CONSTRAINT "order_status_histories_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_gateway_id_foreign" FOREIGN KEY ("payment_gateway_id") REFERENCES "payment_gateways"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_medias" ADD CONSTRAINT "product_medias_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variant_diamonds" ADD CONSTRAINT "product_variant_diamonds_diamond_id_foreign" FOREIGN KEY ("diamond_id") REFERENCES "diamonds"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variant_diamonds" ADD CONSTRAINT "product_variant_diamonds_product_variant_id_foreign" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variant_metals" ADD CONSTRAINT "product_variant_metals_metal_id_foreign" FOREIGN KEY ("metal_id") REFERENCES "metals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variant_metals" ADD CONSTRAINT "product_variant_metals_metal_purity_id_foreign" FOREIGN KEY ("metal_purity_id") REFERENCES "metal_purities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variant_metals" ADD CONSTRAINT "product_variant_metals_metal_tone_id_foreign" FOREIGN KEY ("metal_tone_id") REFERENCES "metal_tones"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variant_metals" ADD CONSTRAINT "product_variant_metals_product_variant_id_foreign" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_size_id_foreign" FOREIGN KEY ("size_id") REFERENCES "sizes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_foreign" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_messages" ADD CONSTRAINT "quotation_messages_quotation_id_foreign" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation_messages" ADD CONSTRAINT "quotation_messages_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_product_variant_id_foreign" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_tax_group_id_foreign" FOREIGN KEY ("tax_group_id") REFERENCES "tax_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_kyc_documents" ADD CONSTRAINT "user_kyc_documents_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_kyc_messages" ADD CONSTRAINT "user_kyc_messages_admin_id_foreign" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_kyc_messages" ADD CONSTRAINT "user_kyc_messages_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_variant_id_foreign" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_foreign" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_customer_id_foreign" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
