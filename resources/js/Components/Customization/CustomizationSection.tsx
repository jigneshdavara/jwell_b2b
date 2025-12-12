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
}

export default function CustomizationSection({
    configurationOptions,
    selectedVariantId,
    onVariantChange,
}: Props) {
    const [metalId, setMetalId] = useState<number | "">("");
    const [purityId, setPurityId] = useState<number | "">("");
    const [toneId, setToneId] = useState<number | "">("");
    const [size, setSize] = useState<string>("");

    /* ---------- Detect if size exists ---------- */
    const hasSize = useMemo(() => {
        return configurationOptions.some(
            (c) =>
                c.size ||
                c.metadata?.size_cm ||
                c.metadata?.size_value
        );
    }, [configurationOptions]);

    /* ---------- Sync from selected variant ---------- */
    const selectedConfig = useMemo(
        () =>
            configurationOptions.find(
                (c) => c.variant_id === selectedVariantId
            ) ?? null,
        [selectedVariantId, configurationOptions]
    );

    useEffect(() => {
        if (!selectedConfig) return;

        const metal = selectedConfig.metals[0];
        setMetalId(metal.metalId);
        setPurityId(metal.metalPurityId ?? "");
        setToneId(metal.metalToneId ?? "");

        if (hasSize) {
            const s =
                selectedConfig.size?.value ||
                selectedConfig.size?.name ||
                (selectedConfig.metadata?.size_value
                    ? `${selectedConfig.metadata.size_value}${selectedConfig.metadata.size_unit || "cm"}`
                    : "");
            setSize(s);
        }
    }, [selectedConfig, hasSize]);

    /* ---------- Available dropdowns ---------- */

    const availableMetals = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (!map.has(m.metalId)) {
                    map.set(m.metalId, m.metalName || "Metal");
                }
            })
        );
        return [...map.entries()];
    }, [configurationOptions]);

    const availablePurities = useMemo(() => {
        if (!metalId) return [];
        const map = new Map<number, string>();
        configurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === metalId && m.metalPurityId) {
                    map.set(m.metalPurityId, m.purityName || "Purity");
                }
            })
        );
        return [...map.entries()];
    }, [metalId, configurationOptions]);

    const availableTones = useMemo(() => {
        if (!metalId || !purityId) return [];
        const map = new Map<number, string>();
        configurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (
                    m.metalId === metalId &&
                    m.metalPurityId === purityId &&
                    m.metalToneId
                ) {
                    map.set(m.metalToneId, m.toneName || "Tone");
                }
            })
        );
        return [...map.entries()];
    }, [metalId, purityId, configurationOptions]);

    const availableSizes = useMemo(() => {
        if (!hasSize || !metalId || !purityId || !toneId) return [];
        const sizes = new Set<string>();

        configurationOptions.forEach((c) => {
            const match = c.metals.some(
                (m) =>
                    m.metalId === metalId &&
                    m.metalPurityId === purityId &&
                    m.metalToneId === toneId
            );
            if (!match) return;

            if (c.size?.value || c.size?.name)
                sizes.add(c.size.value || c.size.name);

            if (c.metadata?.size_value)
                sizes.add(
                    `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                );
        });

        return [...sizes];
    }, [hasSize, metalId, purityId, toneId, configurationOptions]);

    /* ---------- Auto variant matching ---------- */
    useEffect(() => {
        if (!metalId || !purityId || !toneId) return;
        if (hasSize && !size) return;

        const match = configurationOptions.find((c) => {
            const metalMatch = c.metals.some(
                (m) =>
                    m.metalId === metalId &&
                    m.metalPurityId === purityId &&
                    m.metalToneId === toneId
            );
            if (!metalMatch) return false;

            if (!hasSize) return true;

            const s =
                c.size?.value ||
                c.size?.name ||
                (c.metadata?.size_value
                    ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                    : "");

            return s === size;
        });

        if (match) {
            onVariantChange(match.variant_id);
        }
    }, [
        metalId,
        purityId,
        toneId,
        size,
        hasSize,
        configurationOptions,
        onVariantChange,
    ]);

    /* ---------- UI ---------- */
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0E244D]">
                Customization
            </h3>

            <select
                value={metalId}
                onChange={(e) => {
                    setMetalId(Number(e.target.value));
                    setPurityId("");
                    setToneId("");
                    setSize("");
                }}
                className="w-full rounded-2xl border border-elvee-blue/20 bg-white px-4 py-2.5 text-sm font-medium text-elvee-blue transition-all focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 hover:border-elvee-blue/40"
            >
                <option value="">Select Metal</option>
                {availableMetals.map(([id, name]) => (
                    <option key={id} value={id}>
                        {name}
                    </option>
                ))}
            </select>

            {metalId && (
                <select
                    value={purityId}
                    onChange={(e) => {
                        setPurityId(Number(e.target.value));
                        setToneId("");
                        setSize("");
                    }}
                    className="w-full rounded-2xl border border-elvee-blue/20 bg-white px-4 py-2.5 text-sm font-medium text-elvee-blue transition-all focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 hover:border-elvee-blue/40"
                >
                    <option value="">Select Purity</option>
                    {availablePurities.map(([id, name]) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </select>
            )}

            {purityId && (
                <select
                    value={toneId}
                    onChange={(e) => {
                        setToneId(Number(e.target.value));
                        setSize("");
                    }}
                    className="w-full rounded-2xl border border-elvee-blue/20 bg-white px-4 py-2.5 text-sm font-medium text-elvee-blue transition-all focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 hover:border-elvee-blue/40"
                >
                    <option value="">Select Tone</option>
                    {availableTones.map(([id, name]) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </select>
            )}

            {hasSize && toneId && (
                <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full rounded-2xl border border-elvee-blue/20 bg-white px-4 py-2.5 text-sm font-medium text-elvee-blue transition-all focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 hover:border-elvee-blue/40"
                >
                    <option value="">Select Size</option>
                    {availableSizes.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
