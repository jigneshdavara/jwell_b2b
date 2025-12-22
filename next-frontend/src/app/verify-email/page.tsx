"use client";

import PrimaryButton from "@/components/ui/PrimaryButton";
import GuestLayout from "@/components/shared/GuestLayout";
import { FormEvent, useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { useRouter, useSearchParams } from "next/navigation";
import TextInput from "@/components/ui/TextInput";
import InputLabel from "@/components/ui/InputLabel";
import InputError from "@/components/ui/InputError";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if we're verifying from a link (id and hash in URL)
  useEffect(() => {
    const id = searchParams.get("id");
    const hash = searchParams.get("hash");
    if (id && hash) {
      handleVerifyEmail(id, hash);
    }
  }, [searchParams]);

  const handleVerifyEmail = async (id: string, hash: string) => {
    setProcessing(true);
    setStatus(null);
    setErrors({});

    try {
      const response = await authService.verifyEmail(id, hash);
      setStatus(
        response.data?.message || "Email verified successfully. You can now log in."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setErrors({
        email:
          error.response?.data?.message || "Invalid or expired verification link.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setStatus(null);
    setErrors({});

    if (!email) {
      setErrors({ email: "Email is required." });
      setProcessing(false);
      return;
    }

    try {
      const response = await authService.resendVerification(email);
      setStatus(
        response.data?.message ||
          "If that email address exists and is not verified, we will send a verification link."
      );
    } catch (error: any) {
      setErrors({
        email:
          error.response?.data?.message || "Failed to send verification email.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push("/");
  };

  return (
    <GuestLayout>
      <div className="mx-auto max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10">
        <div className="mb-4 text-sm text-ink/80">
          Thanks for signing up! Before getting started, could you verify your
          email address by clicking on the link we just emailed to you? If you
          didn&apos;t receive the email, we will gladly send you another.
        </div>

        {status && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
              status.includes("verified")
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-feather-gold/30 bg-feather-gold/10 text-ink"
            }`}
          >
            {status}
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {Object.values(errors)[0]}
          </div>
        )}

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <InputLabel htmlFor="email" value="Email" />
            <TextInput
              id="email"
              type="email"
              name="email"
              value={email}
              className="mt-1 block w-full"
              autoComplete="username"
              isFocused={true}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputError message={errors.email} className="mt-2" />
          </div>

          <div className="flex items-center justify-between">
            <PrimaryButton disabled={processing}>
              {processing ? "Sending..." : "Resend Verification Email"}
            </PrimaryButton>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md text-sm text-ink/60 underline hover:text-ink focus:outline-none focus:ring-2 focus:ring-elvee-blue focus:ring-offset-2"
            >
              Log Out
            </button>
          </div>
        </form>
      </div>
    </GuestLayout>
  );
}

