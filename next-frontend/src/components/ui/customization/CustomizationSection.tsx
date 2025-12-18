'use client';

import { useMemo, useState, useEffect } from "react";

interface ConfigMetal {
    metalId: number;
    metalPurityId: number | null;
    metalToneId: number | null;
    metalName?: string;
    purityName?: string;
    toneName?: string;
}

interface ConfigurationOption {
    variant_id: number;
    metals: ConfigMetal[];
    price_total: number;
    price_breakup: {
        base: number;
        metal: number;
        diamond: number;
        making: number;
    };
    size?: {
        id: number;
        name: string;
        value?: string;
    } | null;
    metadata?: Record<string, unknown> | null;
}

interface Props {
    configurationOptions: ConfigurationOption[];
    selectedVariantId: number | null;
    onVariantChange: (id: number | null) => void;
    onSelectionStateChange?: (state: { metalId: number | ""; purityId: number | ""; toneId: number | ""; size: string; hasSize: boolean }) => void;
    validationErrors?: {
        metal?: string;
        purity?: string;
        tone?: string;
        size?: string;
    };
    onClearValidationError?: (field: 'metal' | 'purity' | 'tone' | 'size') => void;
}

export default function CustomizationSection({
    configurationOptions,
    selectedVariantId,
    onVariantChange,
    onSelectionStateChange,
    validationErrors,
    onClearValidationError,
}: Props) {
    const [metalId, setMetalId] = useState<number | "">("");
    const [purityId, setPurityId] = useState<number | "">("");
    const [toneId, setToneId] = useState<number | "">("");
    const [size, setSize] = useState<string>("");

    const hasSize = useMemo(() => {
        return configurationOptions.some((c) => c.size || c.metadata?.size_value);
    }, [configurationOptions]);

    const selectedConfig = useMemo(
        () => configurationOptions.find((c) => c.variant_id === selectedVariantId) ?? null,
        [selectedVariantId, configurationOptions]
    );

    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (!selectedConfig || hasInitialized) return;

        const metal = selectedConfig.metals[0];
        setMetalId(metal.metalId);
        setPurityId(metal.metalPurityId ?? "");
        setToneId(metal.metalToneId ?? "");

        if (hasSize) {
            const s = selectedConfig.size?.value || selectedConfig.size?.name || 
                (selectedConfig.metadata?.size_value ? `${selectedConfig.metadata.size_value}${selectedConfig.metadata.size_unit || "cm"}` : "");
            setSize(s);
        }

        if (onSelectionStateChange) {
            const s = hasSize ? (selectedConfig.size?.value || selectedConfig.size?.name || 
                (selectedConfig.metadata?.size_value ? `${selectedConfig.metadata.size_value}${selectedConfig.metadata.size_unit || "cm"}` : "")) : "";
            onSelectionStateChange({
                metalId: metal.metalId,
                purityId: metal.metalPurityId ?? "",
                toneId: metal.metalToneId ?? "",
                size: s,
                hasSize,
            });
        }
        setHasInitialized(true);
    }, [selectedConfig, hasSize, onSelectionStateChange, hasInitialized]);

    const availableMetals = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) => c.metals.forEach((m) => {
            if (!map.has(m.metalId)) map.set(m.metalId, m.metalName || "Metal");
        }));
        return [...map.entries()];
    }, [configurationOptions]);

    const availablePurities = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) => {
            if (size && hasSize) {
                const s = c.size?.value || c.size?.name || (c.metadata?.size_value ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}` : "");
                if (s !== size) return;
            }
            c.metals.forEach((m) => {
                if (m.metalPurityId && (!metalId || m.metalId === metalId) && (!toneId || m.metalToneId === toneId)) {
                    map.set(m.metalPurityId, m.purityName || "Purity");
                }
            });
        });
        return [...map.entries()];
    }, [metalId, toneId, size, hasSize, configurationOptions]);

    const availableTones = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) => {
            if (size && hasSize) {
                const s = c.size?.value || c.size?.name || (c.metadata?.size_value ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}` : "");
                if (s !== size) return;
            }
            c.metals.forEach((m) => {
                if (m.metalToneId && (!metalId || m.metalId === metalId) && (!purityId || m.metalPurityId === purityId)) {
                    map.set(m.metalToneId, m.toneName || "Tone");
                }
            });
        });
        return [...map.entries()];
    }, [metalId, purityId, size, hasSize, configurationOptions]);

    const availableSizes = useMemo(() => {
        if (!hasSize) return [];
        const sizes = new Set<string>();
        configurationOptions.forEach((c) => {
            const match = c.metals.some((m) => (!metalId || m.metalId === metalId) && (!purityId || m.metalPurityId === purityId) && (!toneId || m.metalToneId === toneId));
            if (!match) return;
            if (c.size?.value || c.size?.name) sizes.add(c.size.value || c.size.name);
            if (c.metadata?.size_value) sizes.add(`${c.metadata.size_value}${c.metadata.size_unit || "cm"}`);
        });
        return [...sizes];
    }, [hasSize, metalId, purityId, toneId, configurationOptions]);

    useEffect(() => {
        if (!metalId || !purityId || !toneId) return;
        if (hasSize && !size) return;

        const match = configurationOptions.find((c) => {
            const metalMatch = c.metals.some((m) => m.metalId === metalId && m.metalPurityId === purityId && m.metalToneId === toneId);
            if (!metalMatch) return false;
            if (!hasSize) return true;
            const s = c.size?.value || c.size?.name || (c.metadata?.size_value ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}` : "");
            return s === size;
        });

        if (match) {
            onVariantChange(match.variant_id);
            if (onClearValidationError) {
                onClearValidationError('metal');
                onClearValidationError('purity');
                onClearValidationError('tone');
                if (hasSize) onClearValidationError('size');
            }
        }
    }, [metalId, purityId, toneId, size, hasSize, configurationOptions, onVariantChange, onClearValidationError]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0E244D]">Customization</h3>
            <div>
                <select
                    value={metalId === "" ? "" : metalId}
                    onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value);
                        setMetalId(val); setPurityId(""); setToneId(""); setSize("");
                        if (onClearValidationError) {
                            onClearValidationError('purity'); onClearValidationError('tone'); onClearValidationError('size');
                            if (val !== "") onClearValidationError('metal');
                        }
                    }}
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${validationErrors?.metal ? "border-rose-300 bg-rose-50 text-rose-700" : "border-elvee-blue/20 bg-white text-elvee-blue"}`}
                >
                    <option value="">Select Metal</option>
                    {availableMetals.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
                {validationErrors?.metal && <p className="mt-1 text-xs text-rose-600">{validationErrors.metal}</p>}
            </div>
            <div>
                <select
                    value={purityId === "" ? "" : purityId}
                    onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value);
                        setPurityId(val); setToneId(""); setSize("");
                        if (onClearValidationError) {
                            onClearValidationError('tone'); onClearValidationError('size');
                            if (val !== "") onClearValidationError('purity');
                        }
                    }}
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${validationErrors?.purity ? "border-rose-300 bg-rose-50 text-rose-700" : "border-elvee-blue/20 bg-white text-elvee-blue"}`}
                >
                    <option value="">Select Purity</option>
                    {availablePurities.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
                {validationErrors?.purity && <p className="mt-1 text-xs text-rose-600">{validationErrors.purity}</p>}
            </div>
            <div>
                <select
                    value={toneId === "" ? "" : toneId}
                    onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value);
                        setToneId(val); setSize("");
                        if (onClearValidationError) {
                            onClearValidationError('size');
                            if (val !== "") onClearValidationError('tone');
                        }
                    }}
                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${validationErrors?.tone ? "border-rose-300 bg-rose-50 text-rose-700" : "border-elvee-blue/20 bg-white text-elvee-blue"}`}
                >
                    <option value="">Select Tone</option>
                    {availableTones.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
                {validationErrors?.tone && <p className="mt-1 text-xs text-rose-600">{validationErrors.tone}</p>}
            </div>
            {hasSize && (
                <div>
                    <select
                        value={size}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSize(val);
                            if (val !== "" && onClearValidationError) onClearValidationError('size');
                        }}
                        className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${validationErrors?.size ? "border-rose-300 bg-rose-50 text-rose-700" : "border-elvee-blue/20 bg-white text-elvee-blue"}`}
                    >
                        <option value="">Select Size</option>
                        {availableSizes.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {validationErrors?.size && <p className="mt-1 text-xs text-rose-600">{validationErrors.size}</p>}
                </div>
            )}
        </div>
    );
}

