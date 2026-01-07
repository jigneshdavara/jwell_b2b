"use client";

import InputError from "@/components/ui/InputError";
import InputLabel from "@/components/ui/InputLabel";
import TextInput from "@/components/ui/TextInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import GuestLayout from "@/components/shared/GuestLayout";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    confirmPasswordSchema,
    ConfirmPasswordFormData,
} from "@/lib/validation/auth.schema";

export default function ConfirmPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ConfirmPasswordFormData>({
    resolver: zodResolver(confirmPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: ConfirmPasswordFormData) => {
    try {
      setLoading(true);
      await authService.confirmPassword(data.password);
      router.back();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.[0]?.message || 
                           error?.response?.data?.message || 
                           error?.message || 
                           "Invalid password. Please try again.";
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
      <div className="mx-auto max-w-md space-y-4 rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 sm:space-y-6 sm:p-6 lg:p-8">
        <div className="mb-4 text-xs text-gray-600 sm:text-sm">
          This is a secure area of the application. Please confirm your password
          before continuing.
        </div>

        {errors.root && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:px-4 sm:py-3 sm:text-sm">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
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
                  value={field.value || ""}
                  className={`mt-1 ${fieldState.error ? "border-rose-300 focus:border-rose-400" : ""}`}
                  autoFocus
                />
                <InputError message={fieldState.error?.message} className="mt-2" />
              </div>
            )}
          />

          <div className="mt-4 flex items-center justify-end">
            <PrimaryButton className="w-full sm:w-auto" disabled={loading}>
              {loading ? "Confirming..." : "Confirm"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </GuestLayout>
  );
}
