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
