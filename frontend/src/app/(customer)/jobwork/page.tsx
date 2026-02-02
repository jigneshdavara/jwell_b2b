"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type PrefillProduct = {
  id: number;
  name: string;
  sku: string;
  material?: string | null;
  purity?: string | null;
  base_price?: number | null;
  making_charge_amount?: number | null;
  making_charge_percentage?: number | null;
  making_charge_types?: string[];
  calculated_making_charge?: number | null;
  variants: Array<{
    id: number;
    label: string;
    is_default: boolean;
  }>;
  media: Array<{ url: string; alt: string }>;
};

type JobworkRecord = {
  id: number;
  reference: string;
  product?: string | null;
  variant?: string | null;
  quantity: number;
  submission_mode: string;
  status: string;
  delivery_deadline?: string | null;
  created_at: string;
};

type OfferRecord = {
  code: string;
  name: string;
  description?: string | null;
  value: number;
  type: string;
};

type MetalOption = {
  id: number;
  name: string;
  slug: string;
};

type MetalPurityOption = {
  id: number;
  metal_id: number;
  name: string;
};

type MetalToneOption = {
  id: number;
  metal_id: number;
  name: string;
  slug: string;
};

type SubmissionMode = "catalogue" | "custom";

type FormData = {
  submission_mode: SubmissionMode;
  product_id: number | null;
  product_variant_id: number | null;
  type: "customer_supplied" | "vendor_supplied";
  reference_design: string;
  reference_url: string;
  reference_media: string[];
  metal_id: number | "";
  metal_purity_id: number | "";
  metal_tone_id: number | "";
  metal: string;
  purity: string;
  diamond_quality: string;
  quantity: number;
  special_instructions: string;
  delivery_deadline: string;
  wastage_percentage: string;
  manufacturing_charge: string;
};

const submitModes: Array<{
  value: SubmissionMode;
  label: string;
  helper: string;
}> = [
  {
    value: "catalogue",
    label: "Catalogue design",
    helper:
      "Customise an existing Elvee design with metal / variant tweaks.",
  },
  {
    value: "custom",
    label: "Upload bespoke concept",
    helper:
      "Share brand-new concepts with references, AI renders, or CAD briefs.",
  },
];

export default function JobworkPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product_id");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    prefillProduct: null,
    defaultVariantId: null,
    jobworks: [],
    offers: [],
    metals: [],
    metalPurities: [],
    metalTones: [],
  });

  const [form, setForm] = useState<FormData>({
    submission_mode: "custom",
    product_id: null,
    product_variant_id: null,
    type: "customer_supplied",
    reference_design: "",
    reference_url: "",
    reference_media: [],
    metal_id: "",
    metal_purity_id: "",
    metal_tone_id: "",
    metal: "",
    purity: "",
    diamond_quality: "",
    quantity: 1,
    special_instructions: "",
    delivery_deadline: "",
    wastage_percentage: "",
    manufacturing_charge: "",
  });

  const [mode, setMode] = useState<SubmissionMode>("custom");
  const [referenceMediaInput, setReferenceMediaInput] = useState("");
  const [selectedMetalId, setSelectedMetalId] = useState<number | "">("");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Mock jobwork data
      const mockData = {
        prefillProduct: productId ? { id: 1, name: 'Diamond Solitaire Ring', sku: 'ELV-1001', base_price: 125000, material: 'Gold', purity: '18K', variants: [{ id: 1, label: '18K Yellow Gold' }], media: [] } : null,
        defaultVariantId: 1,
        jobworks: [
          { id: 1, reference: 'JW-2025-001', product: 'Diamond Solitaire Ring', variant: '18K Yellow Gold', quantity: 1, submission_mode: 'catalogue', status: 'pending', created_at: new Date().toLocaleDateString() },
        ],
        offers: [
          { code: 'WELVEE10', name: 'Welcome Offer', description: '10% off on making charges', value: 10, type: 'percentage' },
        ],
        metals: [{ id: 1, name: 'Gold' }, { id: 2, name: 'Silver' }],
        metalPurities: [
          { id: 1, metal_id: 1, name: '18K' },
          { id: 2, metal_id: 1, name: '22K' },
        ],
        metalTones: [
          { id: 1, metal_id: 1, name: 'Yellow' },
          { id: 2, metal_id: 1, name: 'White' },
        ],
      };
      setData(mockData);
      setLoading(false);
    };

    fetchData();
  }, [productId]);

  const availablePurities = useMemo(() => {
    if (selectedMetalId === "" || typeof selectedMetalId !== "number")
      return [];
    return data.metalPurities.filter(
      (purity: any) => purity.metal_id === selectedMetalId
    );
  }, [selectedMetalId, data.metalPurities]);

  const availableTones = useMemo(() => {
    if (selectedMetalId === "" || typeof selectedMetalId !== "number")
      return [];
    return data.metalTones.filter(
      (tone: any) => tone.metal_id === selectedMetalId
    );
  }, [selectedMetalId, data.metalTones]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, submission_mode: mode }));
    if (mode === "catalogue" && data.prefillProduct) {
      setForm((prev) => ({
        ...prev,
        product_id: data.prefillProduct.id,
        metal: data.prefillProduct.material ?? "",
        purity: data.prefillProduct.purity ?? "",
        product_variant_id: data.defaultVariantId,
      }));
    }

    if (mode === "custom") {
      setForm((prev) => ({
        ...prev,
        product_id: null,
        product_variant_id: null,
      }));
    }
  }, [mode, data.prefillProduct, data.defaultVariantId]);

  useEffect(() => {
    const media = referenceMediaInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    setForm((prev) => ({ ...prev, reference_media: media }));
  }, [referenceMediaInput]);

  const estimatedAmount = useMemo(() => {
    if (!data.prefillProduct) {
      return null;
    }
    const base = data.prefillProduct.base_price ?? 0;
    const making =
      data.prefillProduct.calculated_making_charge ??
      data.prefillProduct.making_charge_amount ??
      0;

    return base + making;
  }, [data.prefillProduct]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProcessing(true);
    setErrors({});

    // Mock submit
    setTimeout(() => {
      window.location.reload();
      setProcessing(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10">
        <section className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl lg:text-3xl">
                Create a production brief
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                Share modification requirements for catalogue pieces or submit
                brand-new concepts. Our production concierge will revert with
                quotes and timelines.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:gap-3 sm:text-sm">
              <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 font-medium text-slate-700 sm:px-3 sm:py-1">
                Current requests: {data.jobworks.length}
              </span>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1.5 rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                Browse catalogue
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {submitModes.map((option) => {
              const disabled = !data.prefillProduct && option.value === "catalogue";

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => !disabled && setMode(option.value)}
                  disabled={disabled}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm ${
                    mode === option.value
                      ? "bg-slate-900 text-white shadow-slate-900/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-slate-500 sm:mt-3 sm:text-xs">
            {submitModes.find((option) => option.value === mode)?.helper}
            {!data.prefillProduct && mode === "catalogue" && (
              <span className="ml-1.5 font-semibold text-amber-600 sm:ml-2">
                Select a catalogue design first from Browse Catalogue.
              </span>
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 sm:mt-6 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <div className="space-y-3 sm:space-y-4">
                {mode === "catalogue" && data.prefillProduct ? (
                  <div className="space-y-3 rounded-xl border border-slate-200 p-3 sm:space-y-4 sm:rounded-2xl sm:p-4">
                    <div>
                      <p className="text-[10px] text-slate-400 sm:text-xs">Design selected</p>
                      <h2 className="mt-0.5 text-base font-semibold text-slate-900 sm:mt-1 sm:text-lg">
                        {data.prefillProduct.name}
                      </h2>
                      <p className="text-[10px] text-slate-500 sm:text-xs">
                        SKU {data.prefillProduct.sku}
                      </p>
                    </div>
                    <div className="grid gap-2 text-xs text-slate-600 sm:gap-3 sm:text-sm md:grid-cols-2">
                      <div>
                        <p className="font-medium text-slate-500">Base value</p>
                        <p className="text-slate-900">
                          ₹{" "}
                          {(data.prefillProduct.base_price ?? 0).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-500">
                          Making charge
                        </p>
                        {(() => {
                          if (
                            data.prefillProduct.calculated_making_charge !==
                              null &&
                            data.prefillProduct.calculated_making_charge !==
                              undefined
                          ) {
                            return (
                              <p className="text-slate-900">
                                ₹{" "}
                                {data.prefillProduct.calculated_making_charge.toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                            );
                          }

                          const types = data.prefillProduct.making_charge_types || [];
                          const hasFixed =
                            types.includes("fixed") &&
                            data.prefillProduct.making_charge_amount &&
                            data.prefillProduct.making_charge_amount > 0;
                          const hasPercentage =
                            types.includes("percentage") &&
                            data.prefillProduct.making_charge_percentage &&
                            data.prefillProduct.making_charge_percentage > 0;

                          if (hasFixed && hasPercentage) {
                            return (
                              <p className="text-slate-900">
                                ₹{" "}
                                {data.prefillProduct.making_charge_amount?.toLocaleString(
                                  "en-IN"
                                )}{" "}
                                +{" "}
                                {data.prefillProduct.making_charge_percentage}%
                                of metal cost
                              </p>
                            );
                          } else if (hasFixed) {
                            return (
                              <p className="text-slate-900">
                                ₹{" "}
                                {(
                                  data.prefillProduct.making_charge_amount ?? 0
                                ).toLocaleString("en-IN")}{" "}
                                (Fixed)
                              </p>
                            );
                          } else if (hasPercentage) {
                            return (
                              <p className="text-slate-900">
                                {data.prefillProduct.making_charge_percentage}%
                                of metal cost
                              </p>
                            );
                          }

                          return (
                            <p className="text-slate-900">
                              ₹{" "}
                              {(
                                data.prefillProduct.making_charge_amount ?? 0
                              ).toLocaleString("en-IN")}
                            </p>
                          );
                        })()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-500">Purity</p>
                        <p className="text-slate-900">
                          {data.prefillProduct.purity}
                        </p>
                      </div>
                    </div>

                    {data.prefillProduct.variants.length > 0 && (
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-xs font-medium text-slate-600 sm:text-sm">
                          Select variant
                        </p>
                        <div className="grid gap-1.5 sm:gap-2">
                          {data.prefillProduct.variants.map((variant: any) => {
                            const isSelected =
                              form.product_variant_id === variant.id;

                            return (
                              <label
                                key={variant.id}
                                className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-xs transition sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${
                                  isSelected
                                    ? "border-feather-gold bg-feather-gold/10 text-slate-900"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-feather-gold/50"
                                }`}
                              >
                                <span>{variant.label}</span>
                                <span className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="product_variant_id"
                                    value={variant.id}
                                    checked={isSelected}
                                    onChange={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        product_variant_id: variant.id,
                                      }))
                                    }
                                    className="h-4 w-4 text-elvee-blue focus:ring-feather-gold"
                                  />
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {estimatedAmount !== null && (
                      <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">
                        <p className="text-[10px] text-white/70 sm:text-xs">Estimated total</p>
                        <p className="mt-0.5 text-base font-semibold sm:mt-1 sm:text-lg">
                          ₹ {estimatedAmount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-white/70 sm:text-xs">
                          Final value subject to labour & offer adjustments.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                      <span>Reference design summary *</span>
                      <textarea
                        className="min-h-[100px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:min-h-[120px] sm:px-4 sm:py-2.5 sm:text-sm"
                        value={form.reference_design}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            reference_design: event.target.value,
                          }))
                        }
                        placeholder="Describe materials, gemstone placements, finishing details, packaging expectations…"
                      />
                      {errors.reference_design && (
                        <span className="text-xs text-rose-500">
                          {errors.reference_design}
                        </span>
                      )}
                    </label>

                    <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                      <span>Reference media URLs (one per line)</span>
                      <textarea
                        className="min-h-[100px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:min-h-[120px] sm:px-4 sm:py-2.5 sm:text-sm"
                        value={referenceMediaInput}
                        onChange={(event) =>
                          setReferenceMediaInput(event.target.value)
                        }
                        placeholder="https://…"
                      />
                      {errors.reference_media && (
                        <span className="text-xs text-rose-500">
                          {errors.reference_media}
                        </span>
                      )}
                    </label>
                  </div>
                )}

                <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                  <span>Supply Type</span>
                  <select
                    className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        type: event.target.value as FormData["type"],
                      }))
                    }
                  >
                    <option value="customer_supplied">
                      Customer supplying metal/stone
                    </option>
                    <option value="vendor_supplied">
                      Elvee supplying metal/stone
                    </option>
                  </select>
                </label>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                  <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                    <span>Metal *</span>
                    <select
                      className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                      value={form.metal_id}
                      onChange={(event) => {
                        const metalId =
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value);
                        setSelectedMetalId(metalId);
                        const selectedMetal = data.metals.find(
                          (m: any) => m.id === metalId
                        );
                        setForm((prev) => ({
                          ...prev,
                          metal_id: metalId,
                          metal_purity_id: "",
                          metal_tone_id: "",
                          metal: selectedMetal?.name ?? "",
                        }));
                      }}
                    >
                      <option value="">Select metal</option>
                      {data.metals.map((metal: any) => (
                        <option key={metal.id} value={metal.id}>
                          {metal.name}
                        </option>
                      ))}
                    </select>
                    {errors.metal_id && (
                      <span className="text-xs text-rose-500">
                        {errors.metal_id}
                      </span>
                    )}
                    {errors.metal && (
                      <span className="text-xs text-rose-500">
                        {errors.metal}
                      </span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                    <span>Purity</span>
                    <select
                      className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                      value={form.metal_purity_id}
                      onChange={(event) => {
                        const purityId =
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value);
                        const selectedPurity = availablePurities.find(
                          (p: any) => p.id === purityId
                        );
                        setForm((prev) => ({
                          ...prev,
                          metal_purity_id: purityId,
                          purity: selectedPurity?.name ?? "",
                        }));
                      }}
                      disabled={
                        selectedMetalId === "" ||
                        typeof selectedMetalId !== "number"
                      }
                    >
                      <option value="">Select purity</option>
                      {availablePurities.map((purity: any) => (
                        <option key={purity.id} value={purity.id}>
                          {purity.name}
                        </option>
                      ))}
                    </select>
                    {errors.metal_purity_id && (
                      <span className="text-xs text-rose-500">
                        {errors.metal_purity_id}
                      </span>
                    )}
                    {errors.purity && (
                      <span className="text-xs text-rose-500">
                        {errors.purity}
                      </span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                    <span>Tone</span>
                    <select
                      className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                      value={form.metal_tone_id}
                      onChange={(event) => {
                        const toneId =
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value);
                        setForm((prev) => ({
                          ...prev,
                          metal_tone_id: toneId,
                        }));
                      }}
                      disabled={
                        selectedMetalId === "" ||
                        typeof selectedMetalId !== "number"
                      }
                    >
                      <option value="">Select tone</option>
                      {availableTones.map((tone: any) => (
                        <option key={tone.id} value={tone.id}>
                          {tone.name}
                        </option>
                      ))}
                    </select>
                    {errors.metal_tone_id && (
                      <span className="text-xs text-rose-500">
                        {errors.metal_tone_id}
                      </span>
                    )}
                  </label>
                </div>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                    <span>Diamond / Stone quality</span>
                    <input
                      type="text"
                      className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                      value={form.diamond_quality}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          diamond_quality: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                    <span>Quantity</span>
                    <input
                      type="number"
                      min={1}
                      className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          quantity: Number(event.target.value) || 1,
                        }))
                      }
                    />
                    {errors.quantity && (
                      <span className="text-xs text-rose-500">
                        {errors.quantity}
                      </span>
                    )}
                  </label>
                </div>

                <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                  <span>Special instructions</span>
                  <textarea
                    className="min-h-[80px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:min-h-[100px] sm:px-4 sm:py-2.5 sm:text-sm"
                    value={form.special_instructions}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        special_instructions: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
                  <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                    <span>Delivery deadline</span>
                    <input
                      type="date"
                      className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                      value={form.delivery_deadline}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          delivery_deadline: event.target.value,
                        }))
                      }
                    />
                    {errors.delivery_deadline && (
                      <span className="text-xs text-rose-500">
                        {errors.delivery_deadline}
                      </span>
                    )}
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                    <span>Wastage %</span>
                    <input
                      type="number"
                      step="0.01"
                      className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                      value={form.wastage_percentage}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          wastage_percentage: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm">
                    <span>Manufacturing charge (₹)</span>
                    <input
                      type="number"
                      step="0.01"
                      className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                      value={form.manufacturing_charge}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          manufacturing_charge: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-xl border border-slate-200 p-3 sm:rounded-2xl sm:p-4">
                  <h3 className="text-xs font-semibold text-slate-800 sm:text-sm">
                    Active offer playbook
                  </h3>
                  <ul className="mt-2 space-y-2 text-xs text-slate-600 sm:mt-3 sm:space-y-3 sm:text-sm">
                    {data.offers.length ? (
                      data.offers.map((offer: any) => (
                        <li key={offer.code} className="rounded-lg bg-slate-50 p-2.5 sm:rounded-xl sm:p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 sm:text-sm">
                              {offer.name}
                            </span>
                            <span className="text-[10px] text-slate-500 sm:text-xs">
                              {offer.code}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">
                            {offer.description}
                          </p>
                        </li>
                      ))
                    ) : (
                      <li className="text-[10px] text-slate-500 sm:text-xs">
                        No active offers configured.
                      </li>
                    )}
                  </ul>
                </div>

                {data.prefillProduct && data.prefillProduct.media.length > 0 && (
                  <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
                    {data.prefillProduct.media.map((media: any) => (
                      <img
                        key={media.url}
                        src={media.url}
                        alt={media.alt}
                        className="h-28 w-full rounded-xl object-cover shadow sm:h-36 sm:rounded-2xl"
                      />
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {processing ? "Submitting…" : "Submit jobwork request"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">
              Recent jobwork briefs
            </h2>
            <span className="text-[10px] text-slate-500 sm:text-xs">
              Showing latest {data.jobworks.length}
            </span>
          </div>

          <div className="mt-3 overflow-x-auto sm:mt-4">
            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[10px] font-semibold text-slate-500 sm:text-xs">
                <tr>
                  <th className="px-2 py-2 text-left sm:px-4 sm:py-3">Reference</th>
                  <th className="px-2 py-2 text-left sm:px-4 sm:py-3">Design</th>
                  <th className="px-2 py-2 text-left sm:px-4 sm:py-3">Mode</th>
                  <th className="px-2 py-2 text-left sm:px-4 sm:py-3">Qty</th>
                  <th className="px-2 py-2 text-left sm:px-4 sm:py-3">Status</th>
                  <th className="px-2 py-2 text-left sm:px-4 sm:py-3">Delivery</th>
                  <th className="px-2 py-2 text-left sm:px-4 sm:py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.jobworks.map((jobwork: any) => (
                  <tr key={jobwork.id}>
                    <td className="px-2 py-2 font-semibold text-slate-800 sm:px-4 sm:py-3">
                      {jobwork.reference}
                    </td>
                    <td className="px-2 py-2 text-slate-600 sm:px-4 sm:py-3">
                      {jobwork.product ?? "Custom"}
                      {jobwork.variant ? (
                        <span className="block text-[10px] text-slate-400 sm:text-xs">
                          {jobwork.variant}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 capitalize text-slate-500 sm:px-4 sm:py-3">
                      {jobwork.submission_mode}
                    </td>
                    <td className="px-2 py-2 text-slate-600 sm:px-4 sm:py-3">
                      {jobwork.quantity}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 sm:px-3 sm:py-1 sm:text-xs">
                        {jobwork.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-slate-500 sm:px-4 sm:py-3">
                      {jobwork.delivery_deadline ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-slate-500 sm:px-4 sm:py-3">
                      {jobwork.created_at}
                    </td>
                  </tr>
                ))}
                {data.jobworks.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-4 text-center text-xs text-slate-500 sm:px-4 sm:py-6 sm:text-sm"
                    >
                      No jobwork requests yet. Submit your first brief above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
  );
}

