import { z } from "zod";

// Brand Schema
export const brandSchema = z.object({
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
    display_order: z
        .number()
        .int()
        .min(0, "The display order must be at least 0."),
});

export type BrandFormData = z.infer<typeof brandSchema>;
