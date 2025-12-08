import { useMemo } from 'react';
import OptionPill from './OptionPill';

interface ConfigMetal {
    label: string;
    metalId: number;
    metalPurityId: number | null;
    metalToneId: number | null;
    metalWeight?: string | null;
}

interface ConfigDiamond {
    label: string;
    diamondShapeId: number;
    diamondColorId: number;
    diamondClarityId: number;
    stoneCount: number;
    totalCarat: string;
}

interface ConfigurationOption {
    variant_id: number;
    label: string;
    metal_label: string;
    diamond_label: string;
    metals: ConfigMetal[];
    diamonds: ConfigDiamond[];
    price_total: number;
    price_breakup: {
        base: number;
        metal: number;
        diamond: number;
        making: number;
        adjustment: number;
    };
    sku: string;
}

interface MetalCombinationOption {
    id: string; // unique key for this metal combination
    label: string; // e.g., "18K Yellow Gold + 925 Silver"
    variantIds: number[]; // all variant IDs that have this exact metal combination
}

interface DiamondCombinationOption {
    id: string;
    label: string;
    variantIds: number[];
}

interface CustomizationSectionProps {
    configurationOptions: ConfigurationOption[];
    selectedVariantId: number | null;
    onVariantChange: (variantId: number | null) => void;
}

/**
 * CustomizationSection Component
 * 
 * Premium inline customization UI for metal and diamond selection.
 * Shows combined metal and diamond options as pills, with modern description sections.
 */
export default function CustomizationSection({
    configurationOptions,
    selectedVariantId,
    onVariantChange,
}: CustomizationSectionProps) {
    /**
     * Build a clean metal label from a single metal (purity + tone + metal name only)
     * Example: "18K Yellow Gold" (removes weight)
     */
    const buildSingleMetalLabel = (metal: ConfigMetal): string => {
        // Remove weight pattern (e.g., "3.50g", "1.25g", "1g") at the end
        let cleanLabel = metal.label
            .replace(/\s+\d+\.?\d*\s*g\s*$/i, '')
            .replace(/\s+\d+\.?\d*\s*grams?\s*$/i, '')
            .trim();
        
        // Split by space and take exactly the first 3 parts to ensure we only get purity + tone + metal
        const parts = cleanLabel.split(/\s+/).filter(p => p.length > 0);
        if (parts.length >= 3) {
            return parts.slice(0, 3).join(' ');
        }
        return parts.join(' ');
    };

    /**
     * Generate metal combination options from variants
     * Each option shows ALL metals in that variant combined with "+"
     * Example: "18K Yellow Gold + 925 Silver"
     */
    const metalCombinationOptions = useMemo<MetalCombinationOption[]>(() => {
        const combinationMap = new Map<string, MetalCombinationOption>();

        configurationOptions.forEach((config) => {
            if (config.metals.length === 0) {
                return;
            }

            // Build combined label: all metals joined with " + "
            const metalLabels = config.metals.map(buildSingleMetalLabel);
            const combinedLabel = metalLabels.join(' + ');

            // Create a unique key based on the metal combination
            const sortedMetals = config.metals
                .map(m => `${m.metalId}_${m.metalPurityId ?? 'null'}_${m.metalToneId ?? 'null'}`)
                .sort()
                .join('|');
            
            const key = `metals_${sortedMetals}`;

            if (!combinationMap.has(key)) {
                combinationMap.set(key, {
                    id: key,
                    label: combinedLabel,
                    variantIds: [config.variant_id],
                });
            } else {
                const existing = combinationMap.get(key)!;
                if (!existing.variantIds.includes(config.variant_id)) {
                    existing.variantIds.push(config.variant_id);
                }
            }
        });

        return Array.from(combinationMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [configurationOptions]);

    /**
     * Extract a clean diamond label (clarity + color)
     * Example: "SI IJ" from "LG Oval F VVS1 EX 1.00ct (2)"
     */
    const buildSingleDiamondLabel = (diamond: ConfigDiamond): string => {
        const parts = diamond.label.split(' ').filter((p) => p.length > 0 && !p.match(/^\d+\.\d+ct$/i) && !p.match(/^\(\d+\)$/));
        
        let clarity = '';
        let color = '';
        
        // Find clarity (usually contains SI, VS, VVS, IF, FL, etc.)
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (/^(SI|VS|VVS|IF|FL|I[1-3]|VVS[12]|VS[12])/i.test(part)) {
                clarity = part.toUpperCase();
                // Color is typically the part before clarity
                if (i > 0) {
                    const colorPart = parts[i - 1];
                    if (/^[A-Z]{1,2}$/i.test(colorPart) && colorPart.length <= 2) {
                        color = colorPart.toUpperCase();
                    }
                }
                break;
            }
        }
        
        // Fallback: if we didn't find clarity, try to extract from known positions
        if (!clarity && parts.length >= 4) {
            clarity = parts[3]?.toUpperCase() || '';
            color = parts[2]?.toUpperCase() || '';
        }
        
        // Build the label: Clarity + Color (e.g., "SI IJ", "VS GH")
        if (clarity && color) {
            return `${clarity} ${color}`;
        } else if (clarity) {
            return clarity;
        } else {
            return diamond.label.split(' ').slice(0, 4).join(' ');
        }
    };

    /**
     * Generate diamond combination options from variants
     * Each option shows ALL diamonds in that variant combined with "+"
     * Example: "SI IJ + VS GH"
     */
    const diamondCombinationOptions = useMemo<DiamondCombinationOption[]>(() => {
        const combinationMap = new Map<string, DiamondCombinationOption>();

        configurationOptions.forEach((config) => {
            if (config.diamonds.length === 0) {
                return;
            }

            // Build combined label: all diamonds joined with " + "
            const diamondLabels = config.diamonds.map(buildSingleDiamondLabel);
            const combinedLabel = diamondLabels.join(' + ');

            // Create a unique key based on the diamond combination
            const sortedDiamonds = config.diamonds
                .map(d => `${d.diamondShapeId}_${d.diamondColorId}_${d.diamondClarityId}`)
                .sort()
                .join('|');
            
            const key = `diamonds_${sortedDiamonds}`;

            if (!combinationMap.has(key)) {
                combinationMap.set(key, {
                    id: key,
                    label: combinedLabel,
                    variantIds: [config.variant_id],
                });
            } else {
                const existing = combinationMap.get(key)!;
                if (!existing.variantIds.includes(config.variant_id)) {
                    existing.variantIds.push(config.variant_id);
                }
            }
        });

        return Array.from(combinationMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [configurationOptions]);

    // Get currently selected variant
    const selectedConfig = useMemo(
        () => configurationOptions.find((c) => c.variant_id === selectedVariantId) ?? null,
        [selectedVariantId, configurationOptions]
    );

    // Determine selected metal combination from current variant
    const selectedMetalCombo = useMemo<string | null>(() => {
        if (!selectedConfig || selectedConfig.metals.length === 0) {
            return null;
        }
        const sortedMetals = selectedConfig.metals
            .map(m => `${m.metalId}_${m.metalPurityId ?? 'null'}_${m.metalToneId ?? 'null'}`)
            .sort()
            .join('|');
        return `metals_${sortedMetals}`;
    }, [selectedConfig]);

    // Determine selected diamond combination from current variant
    const selectedDiamondQuality = useMemo<string | null>(() => {
        if (!selectedConfig || selectedConfig.diamonds.length === 0) {
            return null;
        }
        const sortedDiamonds = selectedConfig.diamonds
            .map(d => `${d.diamondShapeId}_${d.diamondColorId}_${d.diamondClarityId}`)
            .sort()
            .join('|');
        return `diamonds_${sortedDiamonds}`;
    }, [selectedConfig]);

    /**
     * Find valid diamond combinations for a given metal combination
     */
    const getValidDiamondCombinations = useMemo(() => {
        return (metalCombinationId: string | null): Set<string> => {
            if (!metalCombinationId) {
                return new Set(diamondCombinationOptions.map((d) => d.id));
            }

            const validDiamondCombinations = new Set<string>();
            const metalOption = metalCombinationOptions.find(m => m.id === metalCombinationId);

            if (metalOption) {
                metalOption.variantIds.forEach(variantId => {
                    const config = configurationOptions.find(c => c.variant_id === variantId);
                    if (config && config.diamonds.length > 0) {
                        const sortedDiamonds = config.diamonds
                            .map(d => `${d.diamondShapeId}_${d.diamondColorId}_${d.diamondClarityId}`)
                            .sort()
                            .join('|');
                        const diamondKey = `diamonds_${sortedDiamonds}`;
                        validDiamondCombinations.add(diamondKey);
                    }
                });
            }

            return validDiamondCombinations;
        };
    }, [configurationOptions, diamondCombinationOptions, metalCombinationOptions]);

    /**
     * Find valid metal combinations for a given diamond combination
     */
    const getValidMetalCombinations = useMemo(() => {
        return (diamondCombinationId: string | null): Set<string> => {
            if (!diamondCombinationId) {
                return new Set(metalCombinationOptions.map((m) => m.id));
            }

            const validMetalCombinations = new Set<string>();
            const diamondOption = diamondCombinationOptions.find(d => d.id === diamondCombinationId);

            if (diamondOption) {
                diamondOption.variantIds.forEach(variantId => {
                    const config = configurationOptions.find(c => c.variant_id === variantId);
                    if (config && config.metals.length > 0) {
                        const sortedMetals = config.metals
                            .map(m => `${m.metalId}_${m.metalPurityId ?? 'null'}_${m.metalToneId ?? 'null'}`)
                            .sort()
                            .join('|');
                        const metalKey = `metals_${sortedMetals}`;
                        validMetalCombinations.add(metalKey);
                    }
                });
            }

            return validMetalCombinations;
        };
    }, [configurationOptions, metalCombinationOptions, diamondCombinationOptions]);

    // Get valid options based on current selections
    const validDiamondCombinations = useMemo(
        () => getValidDiamondCombinations(selectedMetalCombo),
        [selectedMetalCombo, getValidDiamondCombinations]
    );

    const validMetalCombinations = useMemo(
        () => getValidMetalCombinations(selectedDiamondQuality),
        [selectedDiamondQuality, getValidMetalCombinations]
    );

    /**
     * Find matching variant when metal combination + diamond combination are selected
     */
    const findMatchingVariant = (metalCombinationId: string, diamondCombinationId: string): number | null => {
        const metalOption = metalCombinationOptions.find(m => m.id === metalCombinationId);
        const diamondOption = diamondCombinationOptions.find(d => d.id === diamondCombinationId);
        
        if (!metalOption || !diamondOption) {
            return null;
        }

        const matchingVariantId = metalOption.variantIds.find(variantId => 
            diamondOption.variantIds.includes(variantId)
        );

        return matchingVariantId ?? null;
    };

    const handleMetalCombinationSelect = (metalCombinationId: string) => {
        if (selectedMetalCombo === metalCombinationId) {
            // Deselect if clicking the same metal combination
            onVariantChange(null);
            return;
        }

        // If a diamond combination is already selected, try to find matching variant
        if (selectedDiamondQuality) {
            const variantId = findMatchingVariant(metalCombinationId, selectedDiamondQuality);
            onVariantChange(variantId);
        } else {
            // Just select the metal combination, wait for diamond selection
            const metalOption = metalCombinationOptions.find(m => m.id === metalCombinationId);
            onVariantChange(metalOption?.variantIds[0] ?? null);
        }
    };

    const handleDiamondCombinationSelect = (diamondCombinationId: string) => {
        if (selectedDiamondQuality === diamondCombinationId) {
            // Deselect if clicking the same diamond combination
            onVariantChange(null);
            return;
        }

        // If a metal combination is already selected, try to find matching variant
        if (selectedMetalCombo) {
            const variantId = findMatchingVariant(selectedMetalCombo, diamondCombinationId);
            onVariantChange(variantId);
        } else {
            // Just select the diamond combination, wait for metal selection
            const diamondOption = diamondCombinationOptions.find(d => d.id === diamondCombinationId);
            onVariantChange(diamondOption?.variantIds[0] ?? null);
        }
    };

    // Check if current combination is invalid
    const isInvalidCombination = selectedMetalCombo && selectedDiamondQuality && !selectedConfig;

    return (
        <div className="space-y-6">
            {/* Customization Header */}
            <div>
                <h2 className="text-lg font-semibold text-[#0E244D] mb-2">Customization</h2>
                <p className="text-sm text-slate-500">
                    Select your preferred metal and diamond quality to see pricing.
                </p>
            </div>

            {/* Metal Combination Options */}
            {metalCombinationOptions.length > 0 && (
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#0E244D]">Metal</label>
                    <div className="flex flex-wrap gap-3">
                        {metalCombinationOptions.map((metalOption) => {
                            const isValid = !selectedDiamondQuality || validMetalCombinations.has(metalOption.id);
                            return (
                                <OptionPill
                                    key={metalOption.id}
                                    isSelected={selectedMetalCombo === metalOption.id}
                                    isDisabled={!isValid}
                                    onClick={() => handleMetalCombinationSelect(metalOption.id)}
                                >
                                    {metalOption.label}
                                </OptionPill>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Diamond Combination Options */}
            {/* {diamondCombinationOptions.length > 0 && (
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#0E244D]">Diamond Quality</label>
                    <div className="flex flex-wrap gap-3">
                        {diamondCombinationOptions.map((diamondOption) => {
                            const isValid = !selectedMetalCombo || validDiamondCombinations.has(diamondOption.id);
                            return (
                                <OptionPill
                                    key={diamondOption.id}
                                    isSelected={selectedDiamondQuality === diamondOption.id}
                                    isDisabled={!isValid}
                                    onClick={() => handleDiamondCombinationSelect(diamondOption.id)}
                                >
                                    {diamondOption.label}
                                </OptionPill>
                            );
                        })}
                    </div>
                </div>
            )} */}

            {/* Invalid combination message */}
            {isInvalidCombination && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    This combination is not available.
                </div>
            )}
        </div>
    );
}
