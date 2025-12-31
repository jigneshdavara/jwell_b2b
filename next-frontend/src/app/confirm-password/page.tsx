"use client";

import InputError from "@/components/ui/InputError";
import InputLabel from "@/components/ui/InputLabel";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TextInput from "@/components/ui/TextInput";
import GuestLayout from "@/components/shared/GuestLayout";
import { FormEvent, useState } from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

export default function ConfirmPasswordPage() {
  const router = useRouter();
  const [data, setData] = useState({
    password: "",
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await authService.confirmPassword(data.password);
      router.back();
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrors({ password: error.response.data.message });
      } else {
        setErrors({
          password: "Invalid password. Please try again.",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <GuestLayout>
      <div className="mx-auto max-w-md space-y-4 rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 sm:space-y-6 sm:p-6 lg:p-8">
        <div className="mb-4 text-xs text-gray-600 sm:text-sm">
          This is a secure area of the application. Please confirm your password
          before continuing.
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <InputLabel htmlFor="password" value="Password" />

            <TextInput
              id="password"
              type="password"
              name="password"
              value={data.password}
              className="mt-1 block w-full"
              isFocused={true}
              onChange={(e) => setData({ ...data, password: e.target.value })}
            />

            <InputError message={errors.password} className="mt-2" />
          </div>

          <div className="mt-4 flex items-center justify-end">
            <PrimaryButton className="w-full sm:w-auto" disabled={processing}>
              {processing ? "Confirming..." : "Confirm"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </GuestLayout>
  );
}

