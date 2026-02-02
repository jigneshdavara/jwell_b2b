'use client';

import { useMemo, useState, useEffect, useCallback } from "react";

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

    /* ---------- Detect if size exists ---------- */
    const hasSize = useMemo(() => {
        return configurationOptions.some(
            (c) =>
                c.size ||
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

    // Track if this is the initial load - only populate once
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (!selectedConfig || hasInitialized) return;

        const metal = selectedConfig.metals[0];
        
        // Set default values on initial load only
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

        if (onSelectionStateChange) {
            const s = hasSize
                ? (selectedConfig.size?.value ||
                    selectedConfig.size?.name ||
                    (selectedConfig.metadata?.size_value
                        ? `${selectedConfig.metadata.size_value}${selectedConfig.metadata.size_unit || "cm"}`
                        : ""))
                : "";
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

    /* ---------- Available dropdowns ---------- */

    // All available metals (not filtered) - for display count
    const allAvailableMetals = useMemo(() => {
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

    const availableMetals = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                // Always show all metals, not filtered by purity or tone
                if (!map.has(m.metalId)) {
                    map.set(m.metalId, m.metalName || "Metal");
                }
            })
        );
        return [...map.entries()];
    }, [configurationOptions]);

    // All available purities (not filtered) - for display count
    const allAvailablePurities = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalPurityId) {
                    map.set(m.metalPurityId, m.purityName || "Purity");
                }
            })
        );
        return [...map.entries()];
    }, [configurationOptions]);

    const availablePurities = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) => {
            // If size is selected first, only include purities from configurations with that size
            if (size && hasSize) {
                const s =
                    c.size?.value ||
                    c.size?.name ||
                    (c.metadata?.size_value
                        ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                        : "");
                if (s !== size) return; // Skip if size doesn't match
            }
            
            c.metals.forEach((m) => {
                // Filter by metal if selected, or by tone if selected
                // Otherwise show all purities
                if (
                    m.metalPurityId &&
                    (!metalId || m.metalId === metalId) &&
                    (!toneId || m.metalToneId === toneId)
                ) {
                    map.set(m.metalPurityId, m.purityName || "Purity");
                }
            });
        });
        return [...map.entries()];
    }, [metalId, toneId, size, hasSize, configurationOptions]);

    // All available tones (not filtered) - for display count
    const allAvailableTones = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalToneId) {
                    map.set(m.metalToneId, m.toneName || "Tone");
                }
            })
        );
        return [...map.entries()];
    }, [configurationOptions]);

    const availableTones = useMemo(() => {
        const map = new Map<number, string>();
        configurationOptions.forEach((c) => {
            // If size is selected first, only include tones from configurations with that size
            if (size && hasSize) {
                const s =
                    c.size?.value ||
                    c.size?.name ||
                    (c.metadata?.size_value
                        ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                        : "");
                if (s !== size) return; // Skip if size doesn't match
            }
            
            c.metals.forEach((m) => {
                // Show all tones if no metal selected
                // If metal selected, filter by metal
                // If purity also selected, filter by metal + purity
                if (
                    m.metalToneId &&
                    (!metalId || m.metalId === metalId) &&
                    (!purityId || m.metalPurityId === purityId)
                ) {
                    map.set(m.metalToneId, m.toneName || "Tone");
                }
            });
        });
        return [...map.entries()];
    }, [metalId, purityId, size, hasSize, configurationOptions]);

    // All available sizes (not filtered) - for display count
    const allAvailableSizes = useMemo(() => {
        if (!hasSize) return [];
        const sizes = new Set<string>();

        configurationOptions.forEach((c) => {
            if (c.size?.value || c.size?.name)
                sizes.add(c.size.value || c.size.name);

            if (c.metadata?.size_value)
                sizes.add(
                    `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                );
        });

        return [...sizes];
    }, [hasSize, configurationOptions]);

    const availableSizes = useMemo(() => {
        if (!hasSize) return [];
        const sizes = new Set<string>();

        configurationOptions.forEach((c) => {
            // Match by metal if selected, then filter by purity if selected, then by tone if selected
            // If no metal selected, show all sizes
            const match = c.metals.some(
                (m) =>
                    (!metalId || m.metalId === metalId) &&
                    (!purityId || m.metalPurityId === purityId) &&
                    (!toneId || m.metalToneId === toneId)
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
            // Clear all validation errors when variant is successfully matched
            if (onClearValidationError) {
                onClearValidationError('metal');
                onClearValidationError('purity');
                onClearValidationError('tone');
                if (hasSize) {
                    onClearValidationError('size');
                }
            }
        }
    }, [
        metalId,
        purityId,
        toneId,
        size,
        hasSize,
        configurationOptions,
        onVariantChange,
        onClearValidationError,
    ]);

    // Wrap onClearValidationError in useCallback to ensure stable reference
    const onClearValidationErrorStable = useCallback(
        (field: 'metal' | 'purity' | 'tone' | 'size') => {
            if (onClearValidationError) {
                onClearValidationError(field);
            }
        },
        [onClearValidationError]
    );

    /* ---------- UI ---------- */
    return (
        <div className="w-full space-y-3 sm:space-y-4">
            <h3 className="text-base font-semibold text-[#0E244D] sm:text-lg">
                Customization
            </h3>

            <div className="w-full">
                <select
                    value={metalId === "" ? "" : metalId}
                    onChange={(e) => {
                        const value = e.target.value;
                        const selectedMetalId = value === "" ? "" : Number(value);
                        
                        // Check if current size is still valid for the new metal
                        let keepSize = false;
                        if (size !== "" && selectedMetalId !== "" && hasSize) {
                            keepSize = configurationOptions.some((c) => {
                                const metalMatch = c.metals.some((m) => m.metalId === selectedMetalId);
                                if (!metalMatch) return false;
                                
                                const s = c.size?.value || c.size?.name ||
                                    (c.metadata?.size_value
                                        ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                                        : "");
                                return s === size;
                            });
                        }
                        
                        setMetalId(selectedMetalId);
                        setPurityId("");
                        setToneId("");
                        // Clear validation errors for cleared fields
                        if (onClearValidationErrorStable) {
                            onClearValidationErrorStable('purity');
                            onClearValidationErrorStable('tone');
                        }
                        // Only clear size if it's not valid for the new metal
                        if (!keepSize) {
                            setSize("");
                            if (onClearValidationErrorStable) {
                                onClearValidationErrorStable('size');
                            }
                        }
                        if (value !== "" && onClearValidationErrorStable) {
                            onClearValidationErrorStable('metal');
                        }
                        if (onSelectionStateChange) {
                            onSelectionStateChange({
                                metalId: selectedMetalId,
                                purityId: "",
                                toneId: "",
                                size: keepSize ? size : "",
                                hasSize,
                            });
                        }
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm ${
                        validationErrors?.metal
                            ? "border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-400/20"
                            : "border-elvee-blue/20 bg-white text-elvee-blue focus:border-feather-gold focus:ring-feather-gold/20 hover:border-elvee-blue/40"
                    }`}
                >
                    <option value="">Select Metal</option>
                    {availableMetals.length > 0 ? (
                        availableMetals.map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>Not available</option>
                    )}
                </select>
                {validationErrors?.metal && (
                    <p className="mt-1 text-xs text-rose-600">{validationErrors.metal}</p>
                )}
            </div>

            <div>
                <select
                    value={purityId === "" ? "" : purityId}
                    onChange={(e) => {
                        const value = e.target.value;
                        const selectedPurityId = value === "" ? "" : Number(value);
                        
                        // Auto-select metal based on selected purity
                        // Also consider size if it's selected first
                        let foundMetalId: number | "" = "";
                        if (selectedPurityId !== "") {
                            // Find which metal this purity belongs to
                            // If size is selected, prioritize finding metal that matches the size
                            for (const c of configurationOptions) {
                                // If size is selected, only consider configurations with that size
                                if (size && hasSize) {
                                    const s =
                                        c.size?.value ||
                                        c.size?.name ||
                                        (c.metadata?.size_value
                                            ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                                            : "");
                                    if (s !== size) continue;
                                }
                                
                                for (const m of c.metals) {
                                    if (m.metalPurityId === selectedPurityId) {
                                        foundMetalId = m.metalId;
                                        break;
                                    }
                                }
                                if (foundMetalId !== "") break;
                            }
                            
                            // Auto-select the metal only if not already selected
                            if (foundMetalId !== "" && !metalId) {
                                setMetalId(foundMetalId);
                                // Clear metal validation error when auto-selected
                                if (onClearValidationErrorStable) {
                                    onClearValidationErrorStable('metal');
                                }
                            }
                        }
                        
                        // Check if current tone is still valid for the new purity
                        let keepTone = false;
                        if (toneId !== "" && selectedPurityId !== "") {
                            // Check if the current tone exists with the new purity
                            keepTone = configurationOptions.some((c) =>
                                c.metals.some(
                                    (m) =>
                                        m.metalToneId === toneId &&
                                        m.metalPurityId === selectedPurityId &&
                                        (!foundMetalId || m.metalId === foundMetalId)
                                )
                            );
                        }
                        
                        setPurityId(selectedPurityId);
                        // Only clear tone if it's not valid for the new purity
                        if (!keepTone) {
                            setToneId("");
                            // Clear tone validation error when cleared
                            if (onClearValidationErrorStable) {
                                onClearValidationErrorStable('tone');
                            }
                        }
                        
                        // Check if current size is still valid for the new purity
                        let keepSize = false;
                        if (size !== "" && selectedPurityId !== "" && hasSize) {
                            keepSize = configurationOptions.some((c) => {
                                const match = c.metals.some(
                                    (m) =>
                                        m.metalPurityId === selectedPurityId &&
                                        (!foundMetalId || m.metalId === foundMetalId) &&
                                        (!keepTone || m.metalToneId === toneId)
                                );
                                if (!match) return false;
                                
                                const s = c.size?.value || c.size?.name ||
                                    (c.metadata?.size_value
                                        ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                                        : "");
                                return s === size;
                            });
                        }
                        
                        // Only clear size if it's not valid for the new purity
                        if (!keepSize) {
                            setSize("");
                            // Clear size validation error when cleared
                            if (onClearValidationErrorStable) {
                                onClearValidationErrorStable('size');
                            }
                        }
                        if (value !== "" && onClearValidationErrorStable) {
                            onClearValidationErrorStable('purity');
                        }
                        if (onSelectionStateChange) {
                            onSelectionStateChange({
                                metalId: foundMetalId !== "" ? foundMetalId : metalId,
                                purityId: selectedPurityId,
                                toneId: keepTone ? toneId : "",
                                size: keepSize ? size : "",
                                hasSize,
                            });
                        }
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm ${
                        validationErrors?.purity
                            ? "border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-400/20"
                            : "border-elvee-blue/20 bg-white text-elvee-blue focus:border-feather-gold focus:ring-feather-gold/20 hover:border-elvee-blue/40"
                    }`}
                >
                    <option value="">Select Purity</option>
                    {availablePurities.length > 0 ? (
                        availablePurities.map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))
                    ) : (
                        <option value="">Not available</option>
                    )}
                </select>
                {validationErrors?.purity && (
                    <p className="mt-1 text-xs text-rose-600">{validationErrors.purity}</p>
                )}
            </div>

            <div>
                <select
                    value={toneId === "" ? "" : toneId}
                    onChange={(e) => {
                        const value = e.target.value;
                        const selectedToneId = value === "" ? "" : Number(value);
                        
                        // Auto-select metal and purity based on selected tone
                        // BUT only if they are not already selected by the user
                        // Also consider size if it's selected first
                        let foundMetalId: number | "" = "";
                        let foundPurityId: number | "" = "";
                        if (selectedToneId !== "") {
                            // Find which metal and purity this tone belongs to
                            // If size is selected, prioritize finding metal/purity that match the size
                            for (const c of configurationOptions) {
                                // If size is selected, only consider configurations with that size
                                if (size && hasSize) {
                                    const s =
                                        c.size?.value ||
                                        c.size?.name ||
                                        (c.metadata?.size_value
                                            ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                                            : "");
                                    if (s !== size) continue;
                                }
                                
                                for (const m of c.metals) {
                                    if (m.metalToneId === selectedToneId) {
                                        foundMetalId = m.metalId;
                                        foundPurityId = m.metalPurityId ?? "";
                                        break;
                                    }
                                }
                                if (foundMetalId !== "") break;
                            }
                            
                            // Auto-select the metal only if not already selected
                            if (foundMetalId !== "" && !metalId) {
                                setMetalId(foundMetalId);
                                // Clear metal validation error when auto-selected
                                if (onClearValidationErrorStable) {
                                    onClearValidationErrorStable('metal');
                                }
                            }
                            // Auto-select the purity only if not already selected
                            if (foundPurityId !== "" && !purityId) {
                                setPurityId(foundPurityId);
                                // Clear purity validation error when auto-selected
                                if (onClearValidationErrorStable) {
                                    onClearValidationErrorStable('purity');
                                }
                            }
                        }
                        
                        // Check if current size is still valid for the new tone
                        let keepSize = false;
                        if (size !== "" && selectedToneId !== "" && hasSize) {
                            keepSize = configurationOptions.some((c) => {
                                const match = c.metals.some(
                                    (m) =>
                                        m.metalToneId === selectedToneId &&
                                        (!metalId || m.metalId === metalId) &&
                                        (!purityId || m.metalPurityId === purityId)
                                );
                                if (!match) return false;
                                
                                const s = c.size?.value || c.size?.name ||
                                    (c.metadata?.size_value
                                        ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                                        : "");
                                return s === size;
                            });
                        }
                        
                        setToneId(selectedToneId);
                        // Only clear size if it's not valid for the new tone
                        if (!keepSize) {
                            setSize("");
                            // Clear size validation error when cleared
                            if (onClearValidationErrorStable) {
                                onClearValidationErrorStable('size');
                            }
                        }
                        if (value !== "" && onClearValidationErrorStable) {
                            onClearValidationErrorStable('tone');
                        }
                        if (onSelectionStateChange) {
                            onSelectionStateChange({
                                metalId: (!metalId && foundMetalId !== "") ? foundMetalId : metalId,
                                purityId: (!purityId && foundPurityId !== "") ? foundPurityId : purityId,
                                toneId: selectedToneId,
                                size: keepSize ? size : "",
                                hasSize,
                            });
                        }
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm ${
                        validationErrors?.tone
                            ? "border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-400/20"
                            : "border-elvee-blue/20 bg-white text-elvee-blue focus:border-feather-gold focus:ring-feather-gold/20 hover:border-elvee-blue/40"
                    }`}
                >
                    <option value="">Select Tone</option>
                    {availableTones.length > 0 ? (
                        availableTones.map(([id, name]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))
                    ) : (
                        <option value="">Not available</option>
                    )}
                </select>
                {validationErrors?.tone && (
                    <p className="mt-1 text-xs text-rose-600">{validationErrors.tone}</p>
                )}
            </div>

            {hasSize && (
                <div className="w-full">
                    <select
                        value={size}
                        onChange={(e) => {
                            const selectedSize = e.target.value;
                            
                            // Check if current metal, purity, and tone are valid for the new size
                            let keepMetal = false;
                            let keepPurity = false;
                            let keepTone = false;
                            
                            if (selectedSize !== "") {
                                // Check if metal is valid for the selected size
                                if (metalId) {
                                    keepMetal = configurationOptions.some((c) => {
                                        const s =
                                            c.size?.value ||
                                            c.size?.name ||
                                            (c.metadata?.size_value
                                                ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                                                : "");
                                        if (s !== selectedSize) return false;
                                        
                                        return c.metals.some((m) => m.metalId === metalId);
                                    });
                                }
                                
                                // Check if purity is valid for the selected size
                                if (purityId && keepMetal) {
                                    keepPurity = configurationOptions.some((c) => {
                                        const s =
                                            c.size?.value ||
                                            c.size?.name ||
                                            (c.metadata?.size_value
                                                ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                                                : "");
                                        if (s !== selectedSize) return false;
                                        
                                        return c.metals.some(
                                            (m) =>
                                                m.metalId === metalId &&
                                                m.metalPurityId === purityId
                                        );
                                    });
                                }
                                
                                // Check if tone is valid for the selected size
                                if (toneId && keepPurity) {
                                    keepTone = configurationOptions.some((c) => {
                                        const s =
                                            c.size?.value ||
                                            c.size?.name ||
                                            (c.metadata?.size_value
                                                ? `${c.metadata.size_value}${c.metadata.size_unit || "cm"}`
                                                : "");
                                        if (s !== selectedSize) return false;
                                        
                                        return c.metals.some(
                                            (m) =>
                                                m.metalId === metalId &&
                                                m.metalPurityId === purityId &&
                                                m.metalToneId === toneId
                                        );
                                    });
                                }
                            }
                            
                            setSize(selectedSize);
                            
                            // Clear metal, purity, and tone if they're not valid for the new size
                            if (!keepMetal && metalId) {
                                setMetalId("");
                                // Clear metal validation error when cleared
                                if (onClearValidationErrorStable) {
                                    onClearValidationErrorStable('metal');
                                }
                            }
                            if (!keepPurity && purityId) {
                                setPurityId("");
                                // Clear purity validation error when cleared
                                if (onClearValidationErrorStable) {
                                    onClearValidationErrorStable('purity');
                                }
                            }
                            if (!keepTone && toneId) {
                                setToneId("");
                                // Clear tone validation error when cleared
                                if (onClearValidationErrorStable) {
                                    onClearValidationErrorStable('tone');
                                }
                            }
                            
                            if (selectedSize !== "" && onClearValidationErrorStable) {
                                onClearValidationErrorStable('size');
                            }
                            if (onSelectionStateChange) {
                                onSelectionStateChange({
                                    metalId: keepMetal ? metalId : "",
                                    purityId: keepPurity ? purityId : "",
                                    toneId: keepTone ? toneId : "",
                                    size: selectedSize,
                                    hasSize,
                                });
                            }
                        }}
                        className={`w-full rounded-xl border px-3 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm ${
                            validationErrors?.size
                                ? "border-rose-300 bg-rose-50 text-rose-700 focus:border-rose-400 focus:ring-rose-400/20"
                                : "border-elvee-blue/20 bg-white text-elvee-blue focus:border-feather-gold focus:ring-feather-gold/20 hover:border-elvee-blue/40"
                        }`}
                    >
                        <option value="">Select Size</option>
                        {availableSizes.length > 0 ? (
                            availableSizes.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))
                        ) : (
                            <option value="">Not available</option>
                        )}
                    </select>
                    {validationErrors?.size && (
                        <p className="mt-1 text-xs text-rose-600">{validationErrors.size}</p>
                    )}
                </div>
            )}
        </div>
    );
}

