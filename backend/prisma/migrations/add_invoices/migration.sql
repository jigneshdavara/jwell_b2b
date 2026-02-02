-- CreateTable
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "invoice_number" VARCHAR(191) NOT NULL,
    "status" VARCHAR(191) NOT NULL DEFAULT 'draft',
    "issue_date" TIMESTAMPTZ(0),
    "due_date" TIMESTAMPTZ(0),
    "subtotal_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(191) NOT NULL DEFAULT 'INR',
    "notes" TEXT,
    "terms" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(0) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(0) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_unique" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_order_id_index" ON "invoices"("order_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "invoices_status_index" ON "invoices"("status");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;


