"use client";

import InputError from "@/components/ui/InputError";
import InputLabel from "@/components/ui/InputLabel";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TextInput from "@/components/ui/TextInput";
import GuestLayout from "@/components/shared/GuestLayout";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authService } from "@/services/authService";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [data, setData] = useState({
    token: token as string,
    email: email,
    password: "",
    password_confirmation: "",
  });

  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await authService.resetPassword(data);
      router.push("/login?status=password-reset");
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrors({ email: error.response.data.message });
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          password: "Failed to reset password. Please try again.",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <GuestLayout>
      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 sm:space-y-6 sm:p-6 lg:p-8">
        <div>
          <InputLabel htmlFor="email" value="Email" />
          <TextInput
            id="email"
            type="email"
            name="email"
            value={data.email}
            className="mt-1 block w-full"
            autoComplete="username"
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <InputError message={errors.email} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="password" value="Password" />
          <TextInput
            id="password"
            type="password"
            name="password"
            value={data.password}
            className="mt-1 block w-full"
            autoComplete="new-password"
            isFocused={true}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <InputError message={errors.password} className="mt-2" />
        </div>

        <div>
          <InputLabel
            htmlFor="password_confirmation"
            value="Confirm Password"
          />
          <TextInput
            type="password"
            name="password_confirmation"
            value={data.password_confirmation}
            className="mt-1 block w-full"
            autoComplete="new-password"
            onChange={(e) =>
              setData({ ...data, password_confirmation: e.target.value })
            }
          />
          <InputError
            message={errors.password_confirmation}
            className="mt-2"
          />
        </div>

        <div className="flex items-center justify-end">
          <PrimaryButton className="w-full" disabled={processing}>
            {processing ? "Resetting..." : "Reset Password"}
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  );
}

