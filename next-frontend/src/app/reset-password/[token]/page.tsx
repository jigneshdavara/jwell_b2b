"use client";

import InputError from "@/components/ui/InputError";
import InputLabel from "@/components/ui/InputLabel";
import TextInput from "@/components/ui/TextInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import GuestLayout from "@/components/shared/GuestLayout";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "@/services/authService";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    resetPasswordSchema,
    ResetPasswordFormData,
} from "@/lib/validation/auth.schema";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      token: token as string,
      email: email,
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      await authService.resetPassword(data);
      router.push("/login?status=password-reset");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.[0]?.message || 
                           error?.response?.data?.message || 
                           error?.message || 
                           "Failed to reset password. Please try again.";
      setError("root", {
        type: "server",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestLayout>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-md space-y-4 rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 sm:space-y-6 sm:p-6 lg:p-8"
      >
        {errors.root && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:px-4 sm:py-3 sm:text-sm">
            {errors.root.message}
          </div>
        )}

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <InputLabel htmlFor="email" value="Email" />
              <TextInput
                id="email"
                type="email"
                {...field}
                className={`mt-1 ${fieldState.error ? "border-rose-300 focus:border-rose-400" : ""}`}
                autoComplete="username"
              />
              <InputError message={fieldState.error?.message} className="mt-2" />
            </div>
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <InputLabel htmlFor="password" value="Password" />
              <TextInput
                id="password"
                type="password"
                {...field}
                className={`mt-1 ${fieldState.error ? "border-rose-300 focus:border-rose-400" : ""}`}
                autoComplete="new-password"
                autoFocus
              />
              <InputError message={fieldState.error?.message} className="mt-2" />
            </div>
          )}
        />

        <Controller
          name="password_confirmation"
          control={control}
          render={({ field, fieldState }) => (
            <div>
              <InputLabel
                htmlFor="password_confirmation"
                value="Confirm Password"
              />
              <TextInput
                id="password_confirmation"
                type="password"
                {...field}
                className={`mt-1 ${fieldState.error ? "border-rose-300 focus:border-rose-400" : ""}`}
                autoComplete="new-password"
              />
              <InputError
                message={fieldState.error?.message}
                className="mt-2"
              />
            </div>
          )}
        />

        <div className="flex items-center justify-end">
          <PrimaryButton className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  );
}
