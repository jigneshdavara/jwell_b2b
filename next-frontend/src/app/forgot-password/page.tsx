"use client";

import InputError from "@/components/ui/InputError";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TextInput from "@/components/ui/TextInput";
import GuestLayout from "@/components/shared/GuestLayout";
import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { authService } from "@/services/authService";

const ArrowRightIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="m9.5 4.5 3.5 3.5-3.5 3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const recoveryHighlights: Array<{
  title: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    title: "Secure reset",
    description:
      "We email a time-bound link that lets you create a fresh password instantly.",
    icon: (
      <svg
        className="h-5 w-5 text-feather-gold"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d="M5 11V7a7 7 0 0 1 14 0v4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="5"
          y="11"
          width="14"
          height="10"
          rx="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "No downtime",
    description:
      "Reset access and jump straight back into quotations, catalogues, and orders.",
    icon: (
      <svg
        className="h-5 w-5 text-feather-gold"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M5 12h14" strokeLinecap="round" />
        <path
          d="M12 5 19 12l-7 7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Concierge support",
    description:
      "Need help? Ping our onboarding team to reverify credentials in minutes.",
    icon: (
      <svg
        className="h-5 w-5 text-feather-gold"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

export default function ForgotPasswordPage() {
  const [data, setData] = useState({
    email: "",
  });
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    setStatus(null);

    try {
      const response = await authService.forgotPassword(data.email);
      setStatus(
        response.data?.message ||
          "If that email address exists, we will send a password reset link."
      );
    } catch (error: any) {
      if (error.response?.data?.message) {
        setStatus(error.response.data.message);
      } else {
        setErrors({
          email: error.response?.data?.message || "Failed to send reset link.",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <GuestLayout>
      <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-1 sm:gap-8 sm:px-6 lg:grid-cols-[420px,minmax(0,1fr)] lg:gap-10 lg:px-10">
        <aside className="space-y-4 rounded-3xl bg-white/85 p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur sm:space-y-6 sm:p-6 lg:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-feather-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-feather-gold sm:px-4 sm:text-xs">
            Account recovery
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-xl font-semibold text-elvee-blue sm:text-2xl lg:text-3xl">
              Let's get you back in
            </h1>
            <p className="text-xs text-ink/80 sm:text-sm">
              Enter the email tied to your Elvee workspace. We'll send a secure
              link so you can set a fresh password.
            </p>
          </div>
          <ul className="space-y-3 sm:space-y-4">
            {recoveryHighlights.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-2xl border border-elvee-blue/10 bg-ivory/70 p-3 sm:gap-4 sm:p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-feather-gold/40 bg-feather-gold/15 sm:h-10 sm:w-10">
                  {item.icon}
                </div>
                <div className="space-y-1 text-xs text-ink/80 sm:text-sm">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink/70 sm:text-sm">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
            >
              Return to sign in
            </Link>
          </p>
        </aside>

        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 sm:p-6 lg:p-8">
            <header className="mb-4 space-y-2 sm:mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-ivory px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-elvee-blue sm:px-3 sm:text-[11px]">
                Reset password
              </div>
              <h2 className="text-xl font-semibold text-elvee-blue sm:text-2xl">
                Receive a recovery link
              </h2>
              <p className="text-xs text-ink/70 sm:text-sm">
                We'll email you a secure reset link. It expires in 30 minutes
                for your safety.
              </p>
            </header>

            {status && (
              <div className="mb-4 rounded-2xl border border-feather-gold/30 bg-feather-gold/10 px-3 py-2 text-xs font-medium text-ink sm:px-4 sm:py-3 sm:text-sm">
                {status}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/60 sm:text-xs"
                >
                  Work email
                </label>
                <TextInput
                  id="email"
                  type="email"
                  name="email"
                  value={data.email}
                  className="mt-2 block w-full"
                  isFocused={true}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                />
                <InputError message={errors.email} className="mt-2" />
              </div>

              <PrimaryButton className="w-full gap-2" disabled={processing}>
                <span>
                  {processing
                    ? "Sending link..."
                    : "Email password reset link"}
                </span>
                {!processing && <ArrowRightIcon />}
              </PrimaryButton>
              <p className="text-center text-[10px] text-ink/60 sm:text-xs">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
                >
                  Back to login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}

