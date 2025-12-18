"use client";

import PrimaryButton from "@/components/ui/PrimaryButton";
import GuestLayout from "@/components/shared/GuestLayout";
import { FormEvent, useState } from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setStatus(null);

    // Mock resend email logic
    setTimeout(() => {
      setStatus("verification-link-sent");
      setProcessing(false);
    }, 1000);
  };

  const handleLogout = async () => {
    router.push("/login");
  };

  return (
    <GuestLayout>
      <div className="mx-auto max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10">
        <div className="mb-4 text-sm text-gray-600">
          Thanks for signing up! Before getting started, could you verify your
          email address by clicking on the link we just emailed to you? If you
          didn&apos;t receive the email, we will gladly send you another.
        </div>

        {status === "verification-link-sent" && (
          <div className="mb-4 text-sm font-medium text-green-600">
            A new verification link has been sent to the email address you
            provided during registration.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mt-4 flex items-center justify-between">
            <PrimaryButton disabled={processing}>
              {processing ? "Sending..." : "Resend Verification Email"}
            </PrimaryButton>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Log Out
            </button>
          </div>
        </form>
      </div>
    </GuestLayout>
  );
}

