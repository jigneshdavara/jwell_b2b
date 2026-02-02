'use client';

import { useState, useMemo } from 'react';

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
    };
    sku: string;
}

interface ProductDetailsPanelProps {
    selectedConfig: ConfigurationOption | null;
    productDescription?: string;
}

export default function ProductDetailsPanel({
    selectedConfig,
    productDescription,
}: ProductDetailsPanelProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'price'>('details');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['metal', 'diamond', 'general', 'description'])
    );

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
            return next;
        });
    };

    // Process individual metals - each metal gets its own data
    const individualMetalData = useMemo(() => {
        if (!selectedConfig || !selectedConfig.metals || selectedConfig.metals.length === 0) {
            return [];
        }

        return selectedConfig.metals.map((metal) => {
            // Use purity name directly from backend (e.g., "18K", "22K", "925")
            const karatage = (metal as any).purityName || metal.label.match(/(\d+K|\d{3})/i)?.[1]?.toUpperCase() || '—';

            // Use tone name directly from backend
            const materialColour = (metal as any).toneName || '—';

            // Gross metal weight for this specific metal
            // ✅ Always use metalWeight from backend; do NOT parse from label
            let grossMetalWeight = '—';
            if (metal.metalWeight) {
                const parsed = parseFloat(metal.metalWeight);
                if (!isNaN(parsed) && parsed > 0) {
                    grossMetalWeight =
                        parsed % 1 === 0 ? `${parsed.toFixed(0)} g` : `${parsed.toFixed(2)} g`;
                } else if (parsed === 0) {
                    grossMetalWeight = '—';
                }
            }

            // Use metal name directly from backend
            const metalType = (metal as any).metalName || 
                (metal.label.toLowerCase().includes('gold') ? 'Gold' :
                 metal.label.toLowerCase().includes('silver') ? 'Silver' :
                 metal.label.toLowerCase().includes('platinum') ? 'Platinum' : '—');

            // Build clean label for section title (purity + tone + metal name)
            const cleanLabel = metal.label
                // remove any trailing "X g" / "X grams" text if present
                .replace(/\s+\d+\.?\d*\s*g\s*$/i, '')
                .replace(/\s+\d+\.?\d*\s*grams?\s*$/i, '')
                .trim();

            const labelParts = cleanLabel.split(/\s+/).filter((p) => p.length > 0);
            const sectionTitle =
                labelParts.length >= 3 ? labelParts.slice(0, 3).join(' ') : cleanLabel;

            return {
                id: `${metal.metalId}_${metal.metalPurityId ?? 'null'}_${metal.metalToneId ?? 'null'}`,
                title: sectionTitle,
                karatage,
                materialColour,
                grossMetalWeight,
                metal: metalType,
            };
        });
    }, [selectedConfig]);

    // Process individual diamonds - each diamond gets its own data
    const individualDiamondData = useMemo(() => {
        if (!selectedConfig || !selectedConfig.diamonds || selectedConfig.diamonds.length === 0) {
            return [];
        }

        return selectedConfig.diamonds.map((diamond) => {
            const parts = diamond.label
                .split(' ')
                .filter(
                    (p) =>
                        p.length > 0 &&
                        !p.match(/^\d+\.\d+ct$/i) &&
                        !p.match(/^\(\d+\)$/)
                );

            let clarity = '';
            let color = '';
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (/^(SI|VS|VVS|IF|FL|I[1-3]|VVS[12]|VS[12])/i.test(part)) {
                    clarity = part.toUpperCase();
                    if (i > 0) {
                        const colorPart = parts[i - 1];
                        if (/^[A-Z]{1,2}$/i.test(colorPart) && colorPart.length <= 2) {
                            color = colorPart.toUpperCase();
                        }
                    }
                    break;
                }
            }
            const diamondQuality =
                clarity && color
                    ? `${clarity} ${color}`
                    : diamond.label.split(' ').slice(0, 4).join(' ');

            const shapeMatch = diamond.label.match(
                /\b(Round|Princess|Oval|Emerald|Cushion|Marquise|Pear|Asscher|Radiant|Heart)\b/i
            );
            const diamondShape = shapeMatch ? shapeMatch[1] : '—';

            const carat = parseFloat(diamond.totalCarat || '0');
            const caratWeight = !isNaN(carat) && carat > 0 ? `${carat.toFixed(2)} ct` : '—';
            const stoneCount = diamond.stoneCount || 0;
            const numberOfDiamonds = stoneCount > 0 ? stoneCount.toString() : '—';

            return {
                id: `${diamond.diamondShapeId}_${diamond.diamondColorId}_${diamond.diamondClarityId}`,
                diamondQuality,
                diamondShape,
                caratWeight,
                numberOfDiamonds,
            };
        });
    }, [selectedConfig]);

    // Calculate diamond aggregates for summary
    const diamondAggregates = useMemo(() => {
        if (!selectedConfig || selectedConfig.diamonds.length === 0) {
            return null;
        }

        const diamonds = selectedConfig.diamonds;
        const totalCarat = diamonds.reduce((sum, d) => {
            const carat = parseFloat(d.totalCarat || '0');
            return sum + (isNaN(carat) ? 0 : carat);
        }, 0);
        const totalCaratWeight = totalCarat > 0 ? `${totalCarat.toFixed(2)} ct` : '—';

        const totalCount = diamonds.reduce((sum, d) => sum + (d.stoneCount || 0), 0);
        const numberOfDiamonds = totalCount > 0 ? totalCount.toString() : '—';

        return {
            totalCaratWeight,
            numberOfDiamonds,
        };
    }, [selectedConfig]);

    return (
        <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-[#0E244D]/20">
                <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                        activeTab === 'details'
                            ? 'text-[#0E244D] border-b-2 border-[#0E244D]'
                            : 'text-gray-500 hover:text-[#0E244D]'
                    }`}
                >
                    Product Details
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('price')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                        activeTab === 'price'
                            ? 'text-[#0E244D] border-b-2 border-[#0E244D]'
                            : 'text-gray-500 hover:text-[#0E244D]'
                    }`}
                >
                    Price Breakup
                </button>
            </div>

            {/* Product Details Tab */}
            {activeTab === 'details' && (
                <div className="space-y-3 sm:space-y-4">
                    {/* Metal Details Accordion - All metals in one dropdown with separate portions */}
                    {selectedConfig && (
                        <div className="rounded-xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden sm:rounded-2xl">
                            <button
                                type="button"
                                onClick={() => toggleSection('metal')}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F8F5F0]/50 transition-colors active:bg-[#F8F5F0]/70 sm:px-6 sm:py-4"
                            >
                                <h3 className="text-sm font-semibold text-[#0E244D] sm:text-base">
                                    Metal Details
                                </h3>
                                <svg
                                    className={`h-4 w-4 text-[#0E244D] transition-transform sm:h-5 sm:w-5 ${
                                        expandedSections.has('metal') ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            {expandedSections.has('metal') && (
                                <div className="px-4 pb-4 space-y-4 sm:px-6 sm:pb-6 sm:space-y-6">
                                    {individualMetalData.length > 0 ? (
                                        individualMetalData.map((metalData, index) => (
                                            <div
                                                key={metalData.id}
                                                className={
                                                    index > 0
                                                        ? 'pt-4 border-t border-gray-200 sm:pt-6'
                                                        : ''
                                                }
                                            >
                                                <h4 className="text-sm font-semibold text-[#0E244D] mb-3 sm:text-base sm:mb-4">
                                                    {metalData.title}
                                                </h4>
                                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                            Karatage
                                                        </div>
                                                        <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                            {metalData.karatage}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                            Material Colour
                                                        </div>
                                                        <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                            {metalData.materialColour}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                            Gross Metal Weight
                                                        </div>
                                                        <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                            {metalData.grossMetalWeight}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                            Metal
                                                        </div>
                                                        <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                            {metalData.metal}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-500 sm:text-base">
                                            No metal details available for this configuration.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Diamond Details Accordion */}
                    {selectedConfig && (
                        <div className="rounded-xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden sm:rounded-2xl">
                            <button
                                type="button"
                                onClick={() => toggleSection('diamond')}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F8F5F0]/50 transition-colors active:bg-[#F8F5F0]/70 sm:px-6 sm:py-4"
                            >
                                <h3 className="text-sm font-semibold text-[#0E244D] sm:text-base">
                                    Diamond Details
                                </h3>
                                <svg
                                    className={`h-4 w-4 text-[#0E244D] transition-transform sm:h-5 sm:w-5 ${
                                        expandedSections.has('diamond') ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            {expandedSections.has('diamond') && (
                                <div className="px-4 pb-4 space-y-4 sm:px-6 sm:pb-6 sm:space-y-6">
                                    {individualDiamondData.length > 0 ? (
                                        <>
                                            {individualDiamondData.map((diamondData, index) => (
                                                <div
                                                    key={diamondData.id}
                                                    className={
                                                        index > 0
                                                            ? 'pt-4 border-t border-gray-200 sm:pt-6'
                                                            : ''
                                                    }
                                                >
                                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                        <div>
                                                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                                Diamond Quality
                                                            </div>
                                                            <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                                {diamondData.diamondQuality}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                                Diamond Shape
                                                            </div>
                                                            <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                                {diamondData.diamondShape}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                                Carat Weight
                                                            </div>
                                                            <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                                {diamondData.caratWeight}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                                Number of Diamonds
                                                            </div>
                                                            <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                                {diamondData.numberOfDiamonds}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {diamondAggregates && individualDiamondData.length > 1 && (
                                                <div className="pt-4 border-t-2 border-gray-300 sm:pt-6">
                                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                        <div>
                                                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                                Total Carat Weight
                                                            </div>
                                                            <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                                {diamondAggregates.totalCaratWeight}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5 sm:text-sm sm:mb-2">
                                                                Total Number of Diamonds
                                                            </div>
                                                            <div className="text-sm font-semibold text-[#0E244D] sm:text-base lg:text-lg">
                                                                {diamondAggregates.numberOfDiamonds}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-sm text-gray-500 sm:text-base">
                                            No diamond details available for this configuration.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* General Details Accordion */}
                    <div className="rounded-xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden sm:rounded-2xl">
                        <button
                            type="button"
                            onClick={() => toggleSection('general')}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F8F5F0]/50 transition-colors active:bg-[#F8F5F0]/70 sm:px-6 sm:py-4"
                        >
                            <h3 className="text-sm font-semibold text-[#0E244D] sm:text-base">
                                General Details
                            </h3>
                            <svg
                                className={`h-4 w-4 text-[#0E244D] transition-transform sm:h-5 sm:w-5 ${
                                    expandedSections.has('general') ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>
                        {expandedSections.has('general') && (
                            <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                                <div className="text-sm text-gray-600 sm:text-base">
                                    General product information will be displayed here.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description Accordion */}
                    {productDescription && (
                        <div className="rounded-xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden sm:rounded-2xl">
                            <button
                                type="button"
                                onClick={() => toggleSection('description')}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F8F5F0]/50 transition-colors active:bg-[#F8F5F0]/70 sm:px-6 sm:py-4"
                            >
                                <h3 className="text-sm font-semibold text-[#0E244D] sm:text-base">
                                    Description
                                </h3>
                                <svg
                                    className={`h-4 w-4 text-[#0E244D] transition-transform sm:h-5 sm:w-5 ${
                                        expandedSections.has('description') ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            {expandedSections.has('description') && (
                                <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                                    <div 
                                        className="text-sm text-gray-700 leading-relaxed sm:text-base"
                                        dangerouslySetInnerHTML={{ __html: productDescription || '' }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Price Breakup Tab */}
            {activeTab === 'price' && selectedConfig && (
                <div className="rounded-xl bg-white border border-[#0E244D]/10 shadow-sm p-4 sm:rounded-2xl sm:p-6">
                    <h3 className="text-base font-semibold text-[#0E244D] mb-3 sm:text-lg sm:mb-4">
                        Price Breakdown
                    </h3>
                    <div className="space-y-2.5 sm:space-y-3">
                        {selectedConfig.price_breakup.metal > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 sm:text-base">Metal</span>
                                <span className="text-sm font-semibold text-[#0E244D] sm:text-base">
                                    ₹{selectedConfig.price_breakup.metal.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                        {selectedConfig.price_breakup.diamond > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 sm:text-base">Diamond</span>
                                <span className="text-sm font-semibold text-[#0E244D] sm:text-base">
                                    ₹{selectedConfig.price_breakup.diamond.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 sm:text-base">Making Charge</span>
                            <span className="text-sm font-semibold text-[#0E244D] sm:text-base">
                                ₹{selectedConfig.price_breakup.making.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 pt-2.5 mt-2.5 sm:pt-3 sm:mt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-base font-semibold text-[#0E244D] sm:text-lg">
                                    Total
                                </span>
                                <span className="text-lg font-bold text-[#0E244D] sm:text-xl">
                                    ₹{selectedConfig.price_total.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

