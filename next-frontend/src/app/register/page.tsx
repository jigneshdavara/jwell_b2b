"use client";

import InputError from "@/components/ui/InputError";
import InputLabel from "@/components/ui/InputLabel";
import PrimaryButton from "@/components/ui/PrimaryButton";
import TextInput from "@/components/ui/TextInput";
import GuestLayout from "@/components/shared/GuestLayout";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

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

const accountTypes = [
  { value: "retailer", label: "Retailer" },
  { value: "wholesaler", label: "Wholesaler" },
];

const steps = [
  {
    title: "Account setup",
    description: "Who is signing up and how they will log in.",
  },
  {
    title: "Business verification",
    description:
      "Share credentials so we can validate your jewellery practice.",
  },
  {
    title: "Registered address",
    description: "Tell us where to ship and how to contact your team.",
  },
];

const documentChecklist = [
  "GST certificate",
  "PAN card",
  "Storefront photos",
  "Business registration / CIN / MSME",
];

export default function RegisterPage() {
  const router = useRouter();
  const [data, setData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    account_type: "retailer",
    business_name: "",
    gst_number: "",
    pan_number: "",
    registration_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    website: "",
    contact_name: "",
    contact_phone: "",
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLastStep = currentStep === steps.length - 1;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isLastStep) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }

    setProcessing(true);
    setErrors({});

    try {
      await authService.register(data);
      // Redirect to KYC onboarding after registration (matching Laravel behavior)
      router.push("/onboarding/kyc");
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ email: error.response?.data?.message || "Registration failed. Please check your data." });
      }
    } finally {
      setProcessing(false);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, steps.length - 1)));
  };

  const renderAccountStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <div>
          <InputLabel htmlFor="name" value="Full name" />
          <TextInput
            id="name"
            name="name"
            value={data.name}
            className="mt-1 block w-full"
            autoComplete="name"
            isFocused={true}
            onChange={(event) =>
              setData((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <InputError message={errors.name} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="phone" value="Phone" />
          <TextInput
            id="phone"
            name="phone"
            value={data.phone}
            className="mt-1 block w-full"
            autoComplete="tel"
            onChange={(event) =>
              setData((prev) => ({ ...prev, phone: event.target.value }))
            }
            required
          />
          <InputError message={errors.phone} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="email" value="Work email" />
          <TextInput
            id="email"
            type="email"
            name="email"
            value={data.email}
            className="mt-1 block w-full"
            autoComplete="username"
            onChange={(event) =>
              setData((prev) => ({ ...prev, email: event.target.value }))
            }
            required
          />
          <InputError message={errors.email} className="mt-2" />
        </div>
        <div>
          <InputLabel value="Partner type" />
          <div className="mt-2 flex gap-3">
            {accountTypes.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setData((prev) => ({ ...prev, account_type: option.value }))
                }
                className={`w-full rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  data.account_type === option.value
                    ? "border-elvee-blue bg-elvee-blue text-white shadow-lg shadow-elvee-blue/30"
                    : "border-elvee-blue/20 bg-ivory text-elvee-blue hover:border-feather-gold/60 hover:text-feather-gold"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <InputLabel htmlFor="password" value="Password" />
          <TextInput
            id="password"
            type="password"
            name="password"
            value={data.password}
            className="mt-1 block w-full"
            autoComplete="new-password"
            onChange={(event) =>
              setData((prev) => ({ ...prev, password: event.target.value }))
            }
            required
          />
          <InputError message={errors.password} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="password_confirmation" value="Confirm password" />
          <TextInput
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            value={data.password_confirmation}
            className="mt-1 block w-full"
            autoComplete="new-password"
            onChange={(event) =>
              setData((prev) => ({
                ...prev,
                password_confirmation: event.target.value,
              }))
            }
            required
          />
          <InputError message={errors.password_confirmation} className="mt-2" />
        </div>
      </div>
    </div>
  );

  const renderBusinessStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <div>
          <InputLabel htmlFor="business_name" value="Business / store name" />
          <TextInput
            id="business_name"
            name="business_name"
            value={data.business_name}
            className="mt-1 block w-full"
            onChange={(event) =>
              setData((prev) => ({ ...prev, business_name: event.target.value }))
            }
          />
          <InputError message={errors.business_name} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="website" value="Website / Instagram" />
          <TextInput
            id="website"
            name="website"
            value={data.website}
            className="mt-1 block w-full"
            placeholder="@yourbrand or www.example.com"
            onChange={(event) =>
              setData((prev) => ({ ...prev, website: event.target.value }))
            }
          />
          <InputError message={errors.website} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="gst_number" value="GST number" />
          <TextInput
            id="gst_number"
            name="gst_number"
            value={data.gst_number}
            className="mt-1 block w-full uppercase tracking-[0.2em]"
            onChange={(event) =>
              setData((prev) => ({ ...prev, gst_number: event.target.value }))
            }
          />
          <InputError message={errors.gst_number} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="pan_number" value="PAN number" />
          <TextInput
            id="pan_number"
            name="pan_number"
            value={data.pan_number}
            className="mt-1 block w-full uppercase tracking-[0.2em]"
            onChange={(event) =>
              setData((prev) => ({ ...prev, pan_number: event.target.value }))
            }
          />
          <InputError message={errors.pan_number} className="mt-2" />
        </div>
        <div>
          <InputLabel
            htmlFor="registration_number"
            value="Business registration number"
          />
          <TextInput
            id="registration_number"
            name="registration_number"
            value={data.registration_number}
            className="mt-1 block w-full"
            placeholder="MSME / CIN / etc"
            onChange={(event) =>
              setData((prev) => ({
                ...prev,
                registration_number: event.target.value,
              }))
            }
          />
          <InputError message={errors.registration_number} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="contact_name" value="Primary contact" />
          <TextInput
            id="contact_name"
            name="contact_name"
            value={data.contact_name}
            className="mt-1 block w-full"
            placeholder="Owner / authorised signatory"
            onChange={(event) =>
              setData((prev) => ({ ...prev, contact_name: event.target.value }))
            }
          />
          <InputError message={errors.contact_name} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="contact_phone" value="Contact phone" />
          <TextInput
            id="contact_phone"
            name="contact_phone"
            value={data.contact_phone}
            className="mt-1 block w-full"
            placeholder="Optional"
            onChange={(event) =>
              setData((prev) => ({ ...prev, contact_phone: event.target.value }))
            }
          />
          <InputError message={errors.contact_phone} className="mt-2" />
        </div>
      </div>
      <p className="text-xs text-ink/70 sm:text-sm">
        Tip: Upload these documents after registration to accelerate compliance
        reviews (GST certificate, PAN, store photographs).
      </p>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <InputLabel htmlFor="address_line1" value="Address line 1" />
          <TextInput
            id="address_line1"
            name="address_line1"
            value={data.address_line1}
            className="mt-1 block w-full"
            onChange={(event) =>
              setData((prev) => ({ ...prev, address_line1: event.target.value }))
            }
          />
          <InputError message={errors.address_line1} className="mt-2" />
        </div>
        <div className="md:col-span-2">
          <InputLabel htmlFor="address_line2" value="Address line 2" />
          <TextInput
            id="address_line2"
            name="address_line2"
            value={data.address_line2}
            className="mt-1 block w-full"
            onChange={(event) =>
              setData((prev) => ({ ...prev, address_line2: event.target.value }))
            }
          />
          <InputError message={errors.address_line2} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="city" value="City" />
          <TextInput
            id="city"
            name="city"
            value={data.city}
            className="mt-1 block w-full"
            onChange={(event) =>
              setData((prev) => ({ ...prev, city: event.target.value }))
            }
          />
          <InputError message={errors.city} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="state" value="State" />
          <TextInput
            id="state"
            name="state"
            value={data.state}
            className="mt-1 block w-full"
            onChange={(event) =>
              setData((prev) => ({ ...prev, state: event.target.value }))
            }
          />
          <InputError message={errors.state} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="postal_code" value="Postal code" />
          <TextInput
            id="postal_code"
            name="postal_code"
            value={data.postal_code}
            className="mt-1 block w-full tracking-[0.3em]"
            onChange={(event) =>
              setData((prev) => ({ ...prev, postal_code: event.target.value }))
            }
          />
          <InputError message={errors.postal_code} className="mt-2" />
        </div>
        <div>
          <InputLabel htmlFor="country" value="Country" />
          <TextInput
            id="country"
            name="country"
            value={data.country}
            className="mt-1 block w-full"
            onChange={(event) =>
              setData((prev) => ({ ...prev, country: event.target.value }))
            }
          />
          <InputError message={errors.country} className="mt-2" />
        </div>
      </div>
      <p className="text-xs text-ink/70 sm:text-sm">
        Dispatch-ready partners receive pick-up coordination, insured
        shipments, and concierge updates.
      </p>
    </div>
  );

  const renderStepContent = () => {
    if (currentStep === 0) {
      return renderAccountStep();
    }
    if (currentStep === 1) {
      return renderBusinessStep();
    }
    return renderAddressStep();
  };

  const nextLabel = isLastStep ? "Submit registration" : "Continue";

  return (
    <GuestLayout>
      <div className="mx-auto w-full max-w-6xl gap-6 px-1 sm:gap-8 sm:px-6 lg:grid lg:grid-cols-[380px,minmax(0,1fr)] lg:gap-10 lg:px-10">
        <aside className="mb-6 space-y-4 rounded-3xl bg-white/80 p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur sm:mb-8 sm:space-y-6 sm:p-6 lg:mb-0 lg:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-feather-gold sm:text-xs">
            Partner onboarding
          </p>
          <h1 className="text-xl font-semibold text-elvee-blue sm:text-2xl lg:text-3xl">
            Let's introduce your jewellery house
          </h1>
          <p className="text-xs text-ink/80 sm:text-sm">
            Share business credentials and addresses to unlock curated
            catalogues, bullion hedging, and wholesale jobwork in one secure
            space.
          </p>

          <div className="space-y-3 sm:space-y-4">
            {steps.map((step, index) => {
              const isCurrent = index === currentStep;
              const isComplete = index < currentStep;
              return (
                <div
                  key={step.title}
                  className={`rounded-2xl border p-3 sm:p-4 ${
                    isCurrent
                      ? "border-elvee-blue bg-white shadow-lg shadow-elvee-blue/10"
                      : "border-elvee-blue/15 bg-ivory"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold sm:h-10 sm:w-10 sm:text-sm ${
                        isCurrent
                          ? "border-elvee-blue bg-elvee-blue text-white"
                          : isComplete
                          ? "border-feather-gold bg-feather-gold text-white"
                          : "border-elvee-blue/20 bg-white text-elvee-blue"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-elvee-blue sm:text-sm">
                        {step.title}
                      </p>
                      <p className="text-[10px] text-ink/70 sm:text-xs">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 rounded-2xl border border-dashed border-feather-gold/60 bg-feather-gold/5 p-4 sm:space-y-3 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-feather-gold sm:text-xs">
              Recommended documents
            </p>
            <ul className="space-y-1.5 text-xs text-ink/80 sm:space-y-2 sm:text-sm">
              {documentChecklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-feather-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="space-y-4 sm:space-y-6">
          <div className="rounded-3xl bg-white/80 p-4 text-xs text-ink/80 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur sm:p-6 sm:text-sm">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
            >
              Log in instead
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 sm:space-y-6 sm:p-6 lg:p-8"
          >
            <header className="space-y-3 border-b border-elvee-blue/10 pb-4 sm:space-y-4 sm:pb-6">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-ink/60 sm:gap-3 sm:text-xs">
                <span>
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="h-px flex-1 bg-elvee-blue/10" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-elvee-blue sm:text-2xl">
                  {steps[currentStep].title}
                </h2>
                <p className="text-xs text-ink/70 sm:text-sm">
                  {steps[currentStep].description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] sm:gap-3 sm:text-xs">
                {steps.map((step, index) => {
                  const isCurrent = index === currentStep;
                  const isComplete = index < currentStep;
                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() =>
                        (isComplete || isCurrent) && goToStep(index)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition sm:gap-2 sm:px-4 sm:py-2 ${
                        isCurrent
                          ? "bg-elvee-blue text-white shadow shadow-elvee-blue/30"
                          : isComplete
                          ? "bg-feather-gold/20 text-elvee-blue"
                          : "bg-ivory text-ink/60"
                      }`}
                      disabled={!isCurrent && !isComplete}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold sm:h-6 sm:w-6 sm:text-xs ${
                          isCurrent
                            ? "bg-white text-elvee-blue"
                            : isComplete
                            ? "bg-feather-gold text-white"
                            : "bg-white/60 text-elvee-blue"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="hidden sm:inline">{step.title}</span>
                    </button>
                  );
                })}
              </div>
            </header>

            {renderStepContent()}

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(prev - 1, 0))
                  }
                  className="inline-flex items-center justify-center rounded-full border border-elvee-blue/30 px-4 py-2 text-xs font-semibold text-elvee-blue transition hover:border-feather-gold/60 hover:text-feather-gold sm:px-5 sm:py-3 sm:text-sm"
                >
                  Back
                </button>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/60 sm:text-xs">
                  Start your profile
                </span>
              )}

              <PrimaryButton
                className="w-full gap-2 sm:min-w-[200px]"
                disabled={processing}
              >
                <span>{processing ? "Submitting..." : nextLabel}</span>
                {!processing && <ArrowRightIcon />}
              </PrimaryButton>
            </div>
          </form>
        </section>
      </div>
    </GuestLayout>
  );
}

