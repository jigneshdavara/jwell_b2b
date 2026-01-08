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

// Base Admin User Schema (ZodObject - can be extended)
const baseAdminUserSchema = z.object({
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    email: z
        .string()
        .min(1, "The email field is required.")
        .email("The email must be a valid email address."),
    type: z.enum(["admin", "super-admin", "production", "sales"], {
        errorMap: () => ({ message: "Please select a valid user role." }),
    }),
    admin_group_id: z.string().optional().or(z.literal("")),
});

// Schema for create mode (password required)
export const createAdminUserSchema = baseAdminUserSchema
    .extend({
        password: z.string(),
        password_confirmation: z.string(),
    })
    .superRefine((data, ctx) => {
        // Password validation
        if (!data.password || data.password.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The password field is required.",
                path: ["password"],
            });
        } else if (data.password.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The password must be at least 8 characters.",
                path: ["password"],
            });
        }

        // Password confirmation validation
        if (
            !data.password_confirmation ||
            data.password_confirmation.length === 0
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The password confirmation field is required.",
                path: ["password_confirmation"],
            });
        } else if (
            data.password &&
            data.password_confirmation &&
            data.password !== data.password_confirmation
        ) {
            // Only show "does not match" error if BOTH fields have values
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "The password confirmation does not match.",
                path: ["password_confirmation"],
            });
        }
    });

// Schema for edit mode (password optional)
export const editAdminUserSchema = baseAdminUserSchema
    .extend({
        password: z.string().optional(),
        password_confirmation: z.string().optional(),
    })
    .refine(
        (data) => {
            // If password is provided, it must be at least 8 characters
            if (data.password && data.password.length > 0) {
                return data.password.length >= 8;
            }
            return true;
        },
        {
            message: "The password must be at least 8 characters.",
            path: ["password"],
        }
    )
    .refine(
        (data) => {
            // Only validate password matching if BOTH fields have values
            // If user is typing password but hasn't entered confirmation yet, don't show error
            const hasPassword = data.password && data.password.length > 0;
            const hasConfirmation =
                data.password_confirmation &&
                data.password_confirmation.length > 0;

            // If both fields have values, they must match
            if (hasPassword && hasConfirmation) {
                return data.password === data.password_confirmation;
            }

            // If password exists but confirmation is empty, that's okay (user is still typing)
            // If both are empty, that's okay (user doesn't want to change password)
            return true;
        },
        {
            message: "The password confirmation does not match.",
            path: ["password_confirmation"],
        }
    );

// Base schema for type inference (uses edit schema structure)
export const adminUserSchema = editAdminUserSchema;

export type AdminUserFormData = z.infer<typeof adminUserSchema>;
export type CreateAdminUserFormData = z.infer<typeof createAdminUserSchema>;
export type EditAdminUserFormData = z.infer<typeof editAdminUserSchema>;

// Admin Group Schema
export const adminGroupSchema = z.object({
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
    display_order: z
        .number()
        .int()
        .min(0, "The display order must be at least 0.")
        .default(0),
    features: z.array(z.string()).default([]),
});

export type AdminGroupFormData = z.infer<typeof adminGroupSchema>;

// Category Schema
export const categorySchema = z.object({
    parent_id: z
        .union([z.string(), z.number()])
        .optional()
        .or(z.literal(""))
        .nullable(),
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
        .min(0, "The display order must be at least 0.")
        .default(0),
    style_ids: z.array(z.number()).default([]),
    size_ids: z.array(z.number()).default([]),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// Size Schema
export const sizeSchema = z.object({
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
        .min(0, "The display order must be at least 0.")
        .default(0),
});

export type SizeFormData = z.infer<typeof sizeSchema>;

// Style Schema
export const styleSchema = z.object({
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
        .min(0, "The display order must be at least 0.")
        .default(0),
});

export type StyleFormData = z.infer<typeof styleSchema>;

// Metal Schema
export const metalSchema = z.object({
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
        .min(0, "The display order must be at least 0.")
        .default(0),
});

export type MetalFormData = z.infer<typeof metalSchema>;

// Metal Purity Schema
export const metalPuritySchema = z.object({
    metal_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The metal field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
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
        .min(0, "The display order must be at least 0.")
        .default(0),
});

export type MetalPurityFormData = z.infer<typeof metalPuritySchema>;

// Metal Tone Schema (same structure as Metal Purity)
export const metalToneSchema = z.object({
    metal_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The metal field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
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
        .min(0, "The display order must be at least 0.")
        .default(0),
});

export type MetalToneFormData = z.infer<typeof metalToneSchema>;

// Diamond Schema
export const diamondSchema = z.object({
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    diamond_type_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The diamond type field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    diamond_clarity_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The clarity field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    diamond_color_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The color field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    diamond_shape_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The shape field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    diamond_shape_size_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The shape size field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    price: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                const num = typeof val === "string" ? parseFloat(val) : val;
                return !isNaN(num) && num > 0;
            },
            {
                message: "The price must be a valid number greater than 0.",
            }
        )
        .transform((val) => (typeof val === "string" ? parseFloat(val) : val)),
    weight: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                const num = typeof val === "string" ? parseFloat(val) : val;
                return !isNaN(num) && num > 0;
            },
            {
                message: "The weight must be a valid number greater than 0.",
            }
        )
        .transform((val) => (typeof val === "string" ? parseFloat(val) : val)),
    description: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
});

export type DiamondFormData = z.infer<typeof diamondSchema>;

// Diamond Type Schema
export const diamondTypeSchema = z.object({
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    display_order: z
        .number()
        .int()
        .min(0, "The display order must be at least 0.")
        .default(0),
    is_active: z.boolean().default(true),
});

export type DiamondTypeFormData = z.infer<typeof diamondTypeSchema>;

// Diamond Clarity Schema
export const diamondClaritySchema = z.object({
    diamond_type_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The diamond type field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    display_order: z
        .number()
        .int()
        .min(0, "The display order must be at least 0.")
        .default(0),
    is_active: z.boolean().default(true),
});

export type DiamondClarityFormData = z.infer<typeof diamondClaritySchema>;

// Diamond Color Schema
export const diamondColorSchema = z.object({
    diamond_type_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The diamond type field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    display_order: z
        .number()
        .int()
        .min(0, "The display order must be at least 0.")
        .default(0),
    is_active: z.boolean().default(true),
});

export type DiamondColorFormData = z.infer<typeof diamondColorSchema>;

// Diamond Shape Schema
export const diamondShapeSchema = z.object({
    diamond_type_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The diamond type field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    display_order: z
        .number()
        .int()
        .min(0, "The display order must be at least 0.")
        .default(0),
    is_active: z.boolean().default(true),
});

export type DiamondShapeFormData = z.infer<typeof diamondShapeSchema>;

// Diamond Shape Size Schema
export const diamondShapeSizeSchema = z.object({
    diamond_type_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The diamond type field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    diamond_shape_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The diamond shape field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    size: z
        .string()
        .min(1, "The size field is required.")
        .max(191, "The size may not be greater than 191 characters."),
    secondary_size: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    display_order: z
        .number()
        .int()
        .min(0, "The display order must be at least 0.")
        .default(0),
    ctw: z.number().min(0, "The CTW must be at least 0.").default(0),
});

export type DiamondShapeSizeFormData = z.infer<typeof diamondShapeSizeSchema>;

// User Group Schema
export const userGroupSchema = z.object({
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
    display_order: z
        .number()
        .int()
        .min(0, "The display order must be at least 0.")
        .default(0),
});

export type UserGroupFormData = z.infer<typeof userGroupSchema>;

// Catalog Schema
export const catalogSchema = z.object({
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
        .min(0, "The display order must be at least 0.")
        .default(0),
});

export type CatalogFormData = z.infer<typeof catalogSchema>;

// Tax Group Schema
export const taxGroupSchema = z.object({
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
});

export type TaxGroupFormData = z.infer<typeof taxGroupSchema>;

// Tax Schema
export const taxSchema = z.object({
    tax_group_id: z
        .union([z.string(), z.number()])
        .refine(
            (val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                ) {
                    return false;
                }
                return true;
            },
            {
                message: "The tax group field is required.",
            }
        )
        .transform((val) => (typeof val === "string" ? Number(val) : val)),
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters.")
        .transform((val) => val.toUpperCase()),
    rate: z
        .union([z.string(), z.number()])
        .transform((val) => (typeof val === "string" ? Number(val) : val))
        .refine((val) => !isNaN(val) && val >= 0 && val <= 100, {
            message: "The rate must be between 0 and 100.",
        }),
    description: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
});

export type TaxFormData = z.infer<typeof taxSchema>;

// Payment Settings Schema
export const paymentSettingsSchema = z.object({
    publishable_key: z
        .string()
        .min(1, "The publishable key field is required.")
        .max(
            500,
            "The publishable key may not be greater than 500 characters."
        ),
    secret_key: z
        .string()
        .min(1, "The secret key field is required.")
        .max(500, "The secret key may not be greater than 500 characters."),
    webhook_secret: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
});

export type PaymentSettingsFormData = z.infer<typeof paymentSettingsSchema>;

// Order Status Schema
export const orderStatusSchema = z.object({
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    color: z
        .string()
        .min(1, "The color field is required.")
        .regex(
            /^#[0-9A-Fa-f]{6}$/,
            "The color must be a valid hex color code (e.g., #64748b)."
        ),
    is_default: z.boolean().default(false),
    is_active: z.boolean().default(true),
    display_order: z
        .union([z.string(), z.number(), z.null()])
        .transform((val) => {
            if (val === "" || val === null || val === undefined) return null;
            const num = typeof val === "string" ? Number(val) : val;
            return isNaN(num) ? null : num;
        })
        .nullable()
        .optional(),
});

export type OrderStatusFormData = z.infer<typeof orderStatusSchema>;

// Product Variant Metal Schema
const variantMetalSchema = z.object({
    id: z.number().optional(),
    metal_id: z.union([z.number(), z.string()]).transform((val) => {
        if (val === "" || val === null || val === undefined) return "";
        return typeof val === "string" ? Number(val) : val;
    }),
    metal_purity_id: z.union([z.number(), z.string()]).transform((val) => {
        if (val === "" || val === null || val === undefined) return "";
        return typeof val === "string" ? Number(val) : val;
    }),
    metal_tone_id: z.union([z.number(), z.string()]).transform((val) => {
        if (val === "" || val === null || val === undefined) return "";
        return typeof val === "string" ? Number(val) : val;
    }),
    metal_weight: z.string(),
});

// Product Variant Diamond Schema
const variantDiamondSchema = z.object({
    id: z.number().optional(),
    diamond_id: z.union([z.number(), z.string(), z.literal("")]).optional(),
    diamonds_count: z.string().optional(),
});

// Product Variant Schema
const variantSchema = z.object({
    id: z.number().optional(),
    sku: z.string(),
    label: z.string(),
    metal_id: z.union([z.number(), z.string(), z.literal("")]),
    metal_purity_id: z.union([z.number(), z.string(), z.literal("")]),
    diamond_option_key: z.string().nullable().optional(),
    size_id: z.number().nullable().optional(),
    is_default: z.boolean().default(false),
    inventory_quantity: z.union([z.number(), z.string()]).optional(),
    metadata: z.record(z.any()).optional(),
    metals: z.array(variantMetalSchema).default([]),
    diamonds: z.array(variantDiamondSchema).default([]),
});

// Product Schema
export const productSchema = z
    .object({
        sku: z
            .string()
            .min(1, "The SKU field is required.")
            .max(191, "The SKU may not be greater than 191 characters."),
        name: z
            .string()
            .min(1, "The product name field is required.")
            .max(
                191,
                "The product name may not be greater than 191 characters."
            ),
        titleline: z
            .string()
            .min(1, "The title line field is required.")
            .max(191, "The title line may not be greater than 191 characters."),
        description: z.string().optional().or(z.literal("")),
        brand_id: z
            .union([z.string(), z.number(), z.literal("")])
            .refine(
                (val) => {
                    if (
                        val === "" ||
                        val === null ||
                        val === undefined ||
                        val === 0
                    )
                        return false;
                    const num = typeof val === "string" ? Number(val) : val;
                    return !isNaN(num) && num > 0;
                },
                { message: "The brand field is required." }
            )
            .transform((val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                )
                    return "";
                return typeof val === "string" ? val : String(val);
            }),
        category_id: z
            .union([z.string(), z.number(), z.literal("")])
            .refine(
                (val) => {
                    if (
                        val === "" ||
                        val === null ||
                        val === undefined ||
                        val === 0
                    )
                        return false;
                    const num = typeof val === "string" ? Number(val) : val;
                    return !isNaN(num) && num > 0;
                },
                { message: "The category field is required." }
            )
            .transform((val) => {
                if (
                    val === "" ||
                    val === null ||
                    val === undefined ||
                    val === 0
                )
                    return "";
                return typeof val === "string" ? val : String(val);
            }),
        style_ids: z.array(z.number()).default([]),
        collection: z
            .string()
            .min(1, "The collection field is required.")
            .max(191, "The collection may not be greater than 191 characters."),
        producttype: z
            .string()
            .min(1, "The product type field is required.")
            .max(
                191,
                "The product type may not be greater than 191 characters."
            ),
        gender: z.enum(["Men", "Women", "Unisex", "Kids"], {
            errorMap: () => ({ message: "The gender field is required." }),
        }),
        making_charge_amount: z.string().optional().or(z.literal("")),
        making_charge_types: z
            .array(z.enum(["fixed", "percentage"]))
            .min(
                1,
                "Please select at least one making charge type (Fixed Amount or Percentage)."
            ),
        making_charge_percentage: z.string().optional().or(z.literal("")),
        is_active: z.boolean().default(true),
        catalog_ids: z.array(z.number()).default([]),
        subcategory_ids: z.array(z.number()).default([]),
        variants: z.array(variantSchema).optional().default([]),
        // Optional fields for variant generation
        uses_diamond: z.boolean().optional(),
        diamond_selections: z
            .array(
                z.object({
                    diamond_id: z.union([
                        z.number(),
                        z.string(),
                        z.literal(""),
                    ]),
                    count: z.string(),
                })
            )
            .optional(),
        metal_selections: z
            .array(
                z.object({
                    metal_id: z.union([z.number(), z.string(), z.literal("")]),
                    metal_purity_id: z.union([
                        z.number(),
                        z.string(),
                        z.literal(""),
                    ]),
                    metal_tone_id: z.union([
                        z.number(),
                        z.string(),
                        z.literal(""),
                    ]),
                    weight: z.string(),
                })
            )
            .optional(),
        selected_metals: z.array(z.number()).optional(),
        metal_configurations: z
            .record(
                z.object({
                    purities: z.array(z.number()),
                    tones: z.array(z.number()),
                })
            )
            .optional(),
        selected_sizes: z.array(z.number()).optional(),
        all_sizes_available: z.boolean().optional(),
        show_all_variants_by_size: z.boolean().optional(),
        media_uploads: z.array(z.instanceof(File)).optional(),
        removed_media_ids: z.array(z.number()).optional(),
    })
    .superRefine((data, ctx) => {
        // Making charge validation
        if (data.making_charge_types.includes("fixed")) {
            if (
                !data.making_charge_amount ||
                data.making_charge_amount === ""
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "The making charge amount field is required when Fixed Amount is selected.",
                    path: ["making_charge_amount"],
                });
            } else {
                const numValue = Number(data.making_charge_amount);
                if (isNaN(numValue) || numValue < 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "The making charge amount must be a valid number.",
                        path: ["making_charge_amount"],
                    });
                }
            }
        }

        if (data.making_charge_types.includes("percentage")) {
            if (
                !data.making_charge_percentage ||
                data.making_charge_percentage === ""
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "The making charge percentage field is required when Percentage is selected.",
                    path: ["making_charge_percentage"],
                });
            } else {
                const numValue = Number(data.making_charge_percentage);
                if (isNaN(numValue) || numValue < 0 || numValue > 100) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "The making charge percentage must be a valid number between 0 and 100.",
                        path: ["making_charge_percentage"],
                    });
                }
            }
        }
    });

export type ProductFormData = z.infer<typeof productSchema>;

// Offer Schema
export const offerSchema = z.object({
    code: z
        .string()
        .min(1, "The code field is required.")
        .max(191, "The code may not be greater than 191 characters."),
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    type: z.enum(["percentage", "fixed", "free_shipping", "buy_x_get_y"], {
        errorMap: () => ({ message: "Please select a valid offer type." }),
    }),
    value: z
        .union([z.string(), z.number()])
        .transform((val) => (typeof val === "string" ? Number(val) : val))
        .refine((val) => !isNaN(val) && val > 0, {
            message: "The value field is required and must be greater than 0.",
        }),
    min_order_total: z
        .union([z.string(), z.number(), z.literal(""), z.null(), z.undefined()])
        .optional()
        .transform((val) => {
            if (val === "" || val === null || val === undefined) return null;
            const num = typeof val === "string" ? Number(val) : val;
            return isNaN(num) ? null : num;
        })
        .nullable()
        .refine(
            (val) => val === null || (typeof val === "number" && val >= 0),
            {
                message:
                    "The minimum order total must be a valid number greater than or equal to 0.",
            }
        ),
    user_types: z.array(z.string()).default([]),
    user_group_ids: z.array(z.union([z.string(), z.number()])).default([]),
    starts_at: z.string().optional().or(z.literal("")),
    ends_at: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
});

export type OfferFormData = z.infer<typeof offerSchema>;

// Making Charge Discount Schema
export const makingChargeDiscountSchema = z.object({
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(191, "The name may not be greater than 191 characters."),
    description: z.string().optional().or(z.literal("")),
    discount_type: z.enum(["percentage", "fixed"], {
        errorMap: () => ({ message: "Please select a valid discount type." }),
    }),
    value: z
        .union([z.string(), z.number()])
        .transform((val) => (typeof val === "string" ? Number(val) : val))
        .refine((val) => !isNaN(val) && val > 0, {
            message: "The value must be a valid number greater than 0.",
        }),
    brand_id: z
        .union([z.string(), z.number(), z.literal(""), z.null(), z.undefined()])
        .optional()
        .transform((val) => {
            if (val === "" || val === null || val === undefined) return null;
            const num = typeof val === "string" ? Number(val) : val;
            return isNaN(num) ? null : num;
        })
        .nullable(),
    category_id: z
        .union([z.string(), z.number(), z.literal(""), z.null(), z.undefined()])
        .optional()
        .transform((val) => {
            if (val === "" || val === null || val === undefined) return null;
            const num = typeof val === "string" ? Number(val) : val;
            return isNaN(num) ? null : num;
        })
        .nullable(),
    user_group_id: z
        .union([z.string(), z.number(), z.literal(""), z.null(), z.undefined()])
        .optional()
        .transform((val) => {
            if (val === "" || val === null || val === undefined) return null;
            const num = typeof val === "string" ? Number(val) : val;
            return isNaN(num) ? null : num;
        })
        .nullable(),
    user_types: z.array(z.string()).default([]),
    min_cart_total: z
        .union([z.string(), z.number(), z.literal(""), z.null(), z.undefined()])
        .optional()
        .transform((val) => {
            if (val === "" || val === null || val === undefined) return null;
            const num = typeof val === "string" ? Number(val) : val;
            return isNaN(num) ? null : num;
        })
        .nullable()
        .refine(
            (val) => val === null || (typeof val === "number" && val >= 0),
            {
                message:
                    "The minimum cart total must be a valid number greater than or equal to 0.",
            }
        ),
    is_auto: z.boolean().default(true),
    is_active: z.boolean().default(true),
    starts_at: z.string().optional().or(z.literal("")),
    ends_at: z.string().optional().or(z.literal("")),
});

export type MakingChargeDiscountFormData = z.infer<
    typeof makingChargeDiscountSchema
>;

// General Settings Schema
export const generalSettingsSchema = z.object({
    admin_email: z
        .string()
        .min(1, "The admin email field is required.")
        .email("The admin email must be a valid email address."),
    company_name: z
        .string()
        .min(1, "The company name field is required.")
        .max(191, "The company name may not be greater than 191 characters."),
    company_address: z.string().optional().or(z.literal("")),
    company_city: z.string().optional().or(z.literal("")),
    company_state: z.string().optional().or(z.literal("")),
    company_pincode: z.string().optional().or(z.literal("")),
    company_phone: z.string().optional().or(z.literal("")),
    company_email: z
        .string()
        .email("The company email must be a valid email address.")
        .optional()
        .or(z.literal("")),
    company_gstin: z.string().optional().or(z.literal("")),
    app_name: z
        .string()
        .min(1, "The app name field is required.")
        .max(191, "The app name may not be greater than 191 characters."),
    app_timezone: z.string().min(1, "The timezone field is required."),
    app_currency: z.string().min(1, "The currency field is required."),
});

export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
