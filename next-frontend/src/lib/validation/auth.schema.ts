/**
 * Authentication Validation Schemas
 *
 * Zod schemas for login and registration forms
 */

import { z } from "zod";

// Login Schema
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "The email field is required.")
        .email("The email must be a valid email address."),

    password: z
        .string()
        .min(1, "The password field is required.")
        .refine((val) => val.length >= 8, {
            message: "The password must be at least 8 characters.",
        }),

    remember: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// OTP Login Schema
export const otpLoginSchema = z.object({
    email: z
        .string()
        .min(1, "The email field is required.")
        .email("The email must be a valid email address."),

    code: z
        .string()
        .min(1, "The OTP code field is required.")
        .length(6, "The OTP code must be 6 digits."),
});

export type OtpLoginFormData = z.infer<typeof otpLoginSchema>;

// Registration Schema
export const registerSchema = z
    .object({
        // Account Setup
        name: z
            .string()
            .min(1, "The name field is required.")
            .max(191, "The name must not exceed 191 characters."),

        email: z
            .string()
            .min(1, "The email field is required.")
            .email("The email must be a valid email address."),

        phone: z
            .string()
            .min(1, "The phone field is required.")
            .regex(/^[0-9]{10}$/, "The phone must be a valid 10-digit number."),

        password: z
            .string()
            .min(1, "The password field is required.")
            .min(8, "The password must be at least 8 characters."),

        password_confirmation: z
            .string()
            .min(1, "The password confirmation field is required."),

        account_type: z.enum(["retailer", "wholesaler"], {
            required_error: "The account type field is required.",
        }),

        // Business Verification
        business_name: z
            .string()
            .min(1, "The business name field is required.")
            .max(191, "The business name must not exceed 191 characters."),

        gst_number: z
            .string()
            .min(1, "The GST number field is required.")
            .max(15, "The GST number must not exceed 15 characters."),

        pan_number: z
            .string()
            .min(1, "The PAN number field is required.")
            .length(10, "The PAN number must be exactly 10 characters."),

        registration_number: z.string().optional().nullable(),

        // Registered Address
        address_line1: z
            .string()
            .min(1, "The address line 1 field is required.")
            .max(255, "The address line 1 must not exceed 255 characters."),

        address_line2: z.string().optional().nullable(),

        city: z
            .string()
            .min(1, "The city field is required.")
            .max(100, "The city must not exceed 100 characters."),

        state: z
            .string()
            .min(1, "The state field is required.")
            .max(100, "The state must not exceed 100 characters."),

        postal_code: z
            .string()
            .min(1, "The postal code field is required.")
            .regex(
                /^[0-9]{6}$/,
                "The postal code must be a valid 6-digit number."
            ),

        country: z.string().default("India"),

        website: z
            .string()
            .optional()
            .nullable()
            .refine(
                (val) =>
                    !val ||
                    val.trim() === "" ||
                    z.string().url().safeParse(val).success,
                {
                    message: "The website must be a valid URL.",
                }
            ),

        contact_name: z
            .string()
            .min(1, "The contact name field is required.")
            .max(191, "The contact name must not exceed 191 characters."),

        contact_phone: z
            .string()
            .min(1, "The contact phone field is required.")
            .regex(
                /^[0-9]{10}$/,
                "The contact phone must be a valid 10-digit number."
            ),
    })
    .refine(
        (data: { password: string; password_confirmation: string }) =>
            data.password === data.password_confirmation,
        {
            message: "The password confirmation does not match.",
            path: ["password_confirmation"],
        }
    );

export type RegisterFormData = z.infer<typeof registerSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, "The email field is required.")
        .email("The email must be a valid email address."),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset Password Schema
export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, "The token field is required."),
        email: z
            .string()
            .min(1, "The email field is required.")
            .email("The email must be a valid email address."),
        password: z
            .string()
            .min(1, "The password field is required.")
            .min(8, "The password must be at least 8 characters."),
        password_confirmation: z
            .string()
            .min(1, "The password confirmation field is required."),
    })
    .refine(
        (data: { password: string; password_confirmation: string }) =>
            data.password === data.password_confirmation,
        {
            message: "The password confirmation does not match.",
            path: ["password_confirmation"],
        }
    );

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Confirm Password Schema
export const confirmPasswordSchema = z.object({
    password: z
        .string()
        .min(1, "The password field is required.")
        .min(8, "The password must be at least 8 characters."),
});

export type ConfirmPasswordFormData = z.infer<typeof confirmPasswordSchema>;

// Profile Update Schema
export const profileUpdateSchema = z.object({
    name: z
        .string()
        .min(1, "The name field is required.")
        .max(255, "The name must not exceed 255 characters."),

    email: z
        .string()
        .min(1, "The email field is required.")
        .email("The email must be a valid email address.")
        .max(255, "The email must not exceed 255 characters."),

    phone: z
        .string()
        .max(20, "The phone must not exceed 20 characters.")
        .optional()
        .nullable(),

    preferred_language: z
        .enum(["en", "hi", "gu"], {
            errorMap: () => ({ message: "Please select a valid language." }),
        })
        .optional()
        .default("en"),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Update Password Schema (for profile page)
export const updatePasswordSchema = z
    .object({
        current_password: z
            .string()
            .min(1, "The current password field is required."),

        password: z
            .string()
            .min(1, "The password field is required.")
            .min(8, "The password must be at least 8 characters."),

        password_confirmation: z
            .string()
            .min(1, "The password confirmation field is required."),
    })
    .refine(
        (data: { password: string; password_confirmation: string }) =>
            data.password === data.password_confirmation,
        {
            message: "The password confirmation does not match.",
            path: ["password_confirmation"],
        }
    );

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
