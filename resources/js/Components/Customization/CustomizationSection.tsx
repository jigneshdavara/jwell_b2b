import { useMemo, useState, useEffect } from 'react';

interface ConfigMetal {
    label: string;
    metalId: number;
    metalPurityId: number | null;
    metalToneId: number | null;
    metalWeight?: string | null;
    purityName?: string;
    toneName?: string;
    metalName?: string;
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
    };
    sku: string;
    size?: {
        id: number;
        name: string;
        value?: string;
    } | null;
    metadata?: Record<string, unknown> | null;
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
    // Dropdown state
    const [selectedMetalId, setSelectedMetalId] = useState<number | ''>('');
    const [selectedPurityId, setSelectedPurityId] = useState<number | ''>('');
    const [selectedToneId, setSelectedToneId] = useState<number | ''>('');
    const [selectedSize, setSelectedSize] = useState<string>('');

    // Get currently selected variant
    const selectedConfig = useMemo(
        () => configurationOptions.find((c) => c.variant_id === selectedVariantId) ?? null,
        [selectedVariantId, configurationOptions]
    );

    // Sync dropdowns with selected variant
    useEffect(() => {
        if (selectedConfig && selectedConfig.metals.length > 0) {
            const primaryMetal = selectedConfig.metals[0];
            setSelectedMetalId(primaryMetal.metalId);
            setSelectedPurityId(primaryMetal.metalPurityId ?? '');
            setSelectedToneId(primaryMetal.metalToneId ?? '');
            
            // Extract size
            const size = selectedConfig.size?.value || selectedConfig.size?.name;
            if (size) {
                setSelectedSize(size);
            } else if (selectedConfig.metadata) {
                const metadata = selectedConfig.metadata as Record<string, unknown>;
                if (metadata.size_cm) {
                    const sizeCm = parseFloat(String(metadata.size_cm));
                    if (!isNaN(sizeCm)) {
                        setSelectedSize(sizeCm % 1 === 0 ? `${sizeCm}cm` : `${sizeCm.toFixed(1)}cm`);
                    }
                } else if (metadata.size_value) {
                    const sizeValue = String(metadata.size_value);
                    const sizeUnit = metadata.size_unit || 'cm';
                    setSelectedSize(`${sizeValue}${sizeUnit}`);
                }
            }
        } else {
            // Reset if no variant selected
            setSelectedMetalId('');
            setSelectedPurityId('');
            setSelectedToneId('');
            setSelectedSize('');
        }
    }, [selectedConfig]);

    // Extract unique metals
    const availableMetals = useMemo(() => {
        const metalMap = new Map<number, { id: number; name: string }>();
        configurationOptions.forEach(config => {
            config.metals.forEach(metal => {
                if (metal.metalId && !metalMap.has(metal.metalId)) {
                    metalMap.set(metal.metalId, {
                        id: metal.metalId,
                        name: metal.metalName || 'Unknown Metal'
                    });
                }
            });
        });
        return Array.from(metalMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [configurationOptions]);

    // Extract purities for selected metal
    const availablePurities = useMemo(() => {
        if (!selectedMetalId) return [];
        
        const purityMap = new Map<number | null, { id: number | null; name: string }>();
        configurationOptions.forEach(config => {
            config.metals.forEach(metal => {
                if (metal.metalId === selectedMetalId && metal.metalPurityId !== null) {
                    if (!purityMap.has(metal.metalPurityId)) {
                        purityMap.set(metal.metalPurityId, {
                            id: metal.metalPurityId,
                            name: metal.purityName || 'Unknown Purity'
                        });
                    }
                }
            });
        });
        return Array.from(purityMap.values()).sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
    }, [selectedMetalId, configurationOptions]);

    // Extract tones for selected metal + purity
    const availableTones = useMemo(() => {
        if (!selectedMetalId || !selectedPurityId) return [];
        
        const toneMap = new Map<number | null, { id: number | null; name: string }>();
        configurationOptions.forEach(config => {
            config.metals.forEach(metal => {
                if (
                    metal.metalId === selectedMetalId &&
                    metal.metalPurityId === selectedPurityId &&
                    metal.metalToneId !== null
                ) {
                    if (!toneMap.has(metal.metalToneId)) {
                        toneMap.set(metal.metalToneId, {
                            id: metal.metalToneId,
                            name: metal.toneName || 'Unknown Tone'
                        });
                    }
                }
            });
        });
        return Array.from(toneMap.values()).sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
    }, [selectedMetalId, selectedPurityId, configurationOptions]);

    // Extract sizes for selected metal + purity + tone
    const availableSizes = useMemo(() => {
        if (!selectedMetalId || !selectedPurityId || !selectedToneId) return [];
        
        const sizeSet = new Set<string>();
        configurationOptions.forEach(config => {
            const hasMatchingMetal = config.metals.some(metal =>
                metal.metalId === selectedMetalId &&
                metal.metalPurityId === selectedPurityId &&
                metal.metalToneId === selectedToneId
            );
            
            if (hasMatchingMetal) {
                // Check size object first
                if (config.size) {
                    const sizeValue = config.size.value || config.size.name;
                    if (sizeValue) {
                        sizeSet.add(sizeValue);
                    }
                }
                
                // Check metadata as fallback
                if (config.metadata) {
                    const metadata = config.metadata as Record<string, unknown>;
                    if (metadata.size_cm) {
                        const sizeCm = parseFloat(String(metadata.size_cm));
                        if (!isNaN(sizeCm)) {
                            sizeSet.add(sizeCm % 1 === 0 ? `${sizeCm}cm` : `${sizeCm.toFixed(1)}cm`);
                        }
                    } else if (metadata.size_value) {
                        const sizeValue = String(metadata.size_value);
                        const sizeUnit = metadata.size_unit || 'cm';
                        sizeSet.add(`${sizeValue}${sizeUnit}`);
                    }
                }
            }
        });
        
        // Sort sizes numerically if possible
        return Array.from(sizeSet).sort((a, b) => {
            const numA = parseFloat(a.replace(/[^\d.]/g, '')) || 0;
            const numB = parseFloat(b.replace(/[^\d.]/g, '')) || 0;
            if (numA > 0 && numB > 0) return numA - numB;
            return a.localeCompare(b);
        });
    }, [selectedMetalId, selectedPurityId, selectedToneId, configurationOptions]);

    // Find matching variant when all selections are made
    const findMatchingVariant = (
        metalId: number | '',
        purityId: number | '',
        toneId: number | '',
        size: string
    ): number | null => {
        if (!metalId || !purityId || !toneId || !size) return null;

        return configurationOptions.find(config => {
            const hasMatchingMetal = config.metals.some(metal =>
                metal.metalId === metalId &&
                metal.metalPurityId === purityId &&
                metal.metalToneId === toneId
            );

            if (!hasMatchingMetal) return false;

            // Check size match
            const configSize = config.size?.value || config.size?.name;
            if (configSize === size) return true;

            // Check metadata size
            if (config.metadata) {
                const metadata = config.metadata as Record<string, unknown>;
                if (metadata.size_cm) {
                    const sizeCm = parseFloat(String(metadata.size_cm));
                    const sizeValue = parseFloat(size.replace(/[^\d.]/g, ''));
                    if (!isNaN(sizeCm) && !isNaN(sizeValue) && sizeCm === sizeValue) {
                        return true;
                    }
                } else if (metadata.size_value) {
                    const metadataSize = `${metadata.size_value}${metadata.size_unit || 'cm'}`;
                    if (metadataSize === size) return true;
                }
            }

            return false;
        })?.variant_id ?? null;
    };

    // Handle metal change
    const handleMetalChange = (metalId: string) => {
        const id = metalId === '' ? '' : Number(metalId);
        setSelectedMetalId(id);
        setSelectedPurityId('');
        setSelectedToneId('');
        setSelectedSize('');
        onVariantChange(null);
    };

    // Handle purity change
    const handlePurityChange = (purityId: string) => {
        const id = purityId === '' ? '' : Number(purityId);
        setSelectedPurityId(id);
        setSelectedToneId('');
        setSelectedSize('');
        onVariantChange(null);
    };

    // Handle tone change
    const handleToneChange = (toneId: string) => {
        const id = toneId === '' ? '' : Number(toneId);
        setSelectedToneId(id);
        setSelectedSize('');
        onVariantChange(null);
    };

    // Handle size change
    const handleSizeChange = (size: string) => {
        setSelectedSize(size);
        if (selectedMetalId && selectedPurityId && selectedToneId && size) {
            const variantId = findMatchingVariant(selectedMetalId, selectedPurityId, selectedToneId, size);
            onVariantChange(variantId);
        }
    };


    return (
        <div className="space-y-6">
            {/* Customization Header */}
            <div>
                <h2 className="text-lg font-semibold text-[#0E244D] mb-2">Customization</h2>
                <p className="text-sm text-slate-500">
                    Select your preferred metal, purity, tone, and size to see pricing.
                </p>
            </div>

            {/* Cascading Dropdowns: Metal → Purity → Tone → Size */}
            <div className="space-y-4">
                {/* Metal Dropdown */}
                <label className="flex flex-col gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-[#0E244D]">Metal</span>
                    <select
                        value={selectedMetalId}
                        onChange={(e) => handleMetalChange(e.target.value)}
                        className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 transition-all"
                    >
                        <option value="">Select metal</option>
                        {availableMetals.map((metal) => (
                            <option key={metal.id} value={metal.id}>
                                {metal.name}
                            </option>
                        ))}
                    </select>
                </label>

                {/* Purity Dropdown */}
                {selectedMetalId && availablePurities.length > 0 && (
                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-[#0E244D]">Purity</span>
                        <select
                            value={selectedPurityId}
                            onChange={(e) => handlePurityChange(e.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 transition-all"
                        >
                            <option value="">Select purity</option>
                            {availablePurities.map((purity) => (
                                <option key={purity.id ?? 'null'} value={purity.id ?? ''}>
                                    {purity.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {/* Tone Dropdown */}
                {selectedMetalId && selectedPurityId && availableTones.length > 0 && (
                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-[#0E244D]">Tone</span>
                        <select
                            value={selectedToneId}
                            onChange={(e) => handleToneChange(e.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 transition-all"
                        >
                            <option value="">Select tone</option>
                            {availableTones.map((tone) => (
                                <option key={tone.id ?? 'null'} value={tone.id ?? ''}>
                                    {tone.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {/* Size Dropdown */}
                {selectedMetalId && selectedPurityId && selectedToneId && availableSizes.length > 0 && (
                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-[#0E244D]">Size</span>
                        <select
                            value={selectedSize}
                            onChange={(e) => handleSizeChange(e.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 transition-all"
                        >
                            <option value="">Select size</option>
                            {availableSizes.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
        </div>
    );
}
