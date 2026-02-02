/**
 * Customer/Frontend Validation Schemas
 *
 * Zod schemas for customer-facing forms
 */

import { z } from "zod";

// Catalog Product Quotation Request Schema
export const catalogQuotationSchema = z.object({
    quantity: z
        .number()
        .int("Quantity must be a whole number.")
        .min(1, "Quantity must be at least 1."),

    notes: z
        .string()
        .max(1000, "Notes must not exceed 1000 characters.")
        .optional()
        .nullable(),

    // Selection state validation (for metal, purity, tone, size)
    // These are validated separately in the component but included here for type safety
    metalId: z.number().optional(),
    purityId: z.number().optional(),
    toneId: z.number().optional(),
    size: z.string().optional(),
});

export type CatalogQuotationFormData = z.infer<typeof catalogQuotationSchema>;
