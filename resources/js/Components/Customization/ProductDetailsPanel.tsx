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

/**
 * ProductDetailsPanel Component
 *
 * Tanishq-style details panel with tabs and accordion sections.
 * Shows Metal Details, Diamond Details, General Details, and Description.
 */
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
            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }
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

    // Calculate diamond aggregates
    const diamondData = useMemo(() => {
        if (!selectedConfig || selectedConfig.diamonds.length === 0) {
            return null;
        }

        const diamonds = selectedConfig.diamonds;

        // Extract quality (clarity + color) from first diamond
        const firstDiamond = diamonds[0];
        const parts = firstDiamond.label
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
                : firstDiamond.label.split(' ').slice(0, 4).join(' ');

        // Extract shape from label (usually second word after type)
        const shapeMatch = firstDiamond.label.match(
            /\b(Round|Princess|Oval|Emerald|Cushion|Marquise|Pear|Asscher|Radiant|Heart)\b/i
        );
        const diamondShape = shapeMatch ? shapeMatch[1] : '—';

        // Total carat weight
        const totalCarat = diamonds.reduce((sum, d) => {
            const carat = parseFloat(d.totalCarat || '0');
            return sum + (isNaN(carat) ? 0 : carat);
        }, 0);
        const totalCaratWeight = totalCarat > 0 ? `${totalCarat.toFixed(2)} ct` : '—';

        // Total number of diamonds
        const totalCount = diamonds.reduce((sum, d) => sum + (d.stoneCount || 0), 0);
        const numberOfDiamonds = totalCount > 0 ? totalCount.toString() : '—';

        return {
            diamondQuality,
            diamondShape,
            totalCaratWeight,
            numberOfDiamonds,
        };
    }, [selectedConfig]);


    return (
        <div className="mt-6 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-[#0E244D]/20">
                <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
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
                    className={`px-4 py-2 text-sm font-semibold transition-colors ${
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
                <div className="space-y-4">
                    {/* Metal Details Accordion - All metals in one dropdown with separate portions */}
                    {selectedConfig && (
                            <div className="rounded-2xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('metal')}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F8F5F0]/50 transition-colors"
                                >
                                    <h3 className="text-base font-semibold text-[#0E244D]">
                                        Metal Details
                                    </h3>
                                    <svg
                                        className={`w-5 h-5 text-[#0E244D] transition-transform ${
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
                                    <div className="px-6 pb-6 space-y-6">
                                        {individualMetalData.length > 0 ? (
                                            individualMetalData.map((metalData, index) => (
                                                <div
                                                    key={metalData.id}
                                                    className={
                                                        index > 0
                                                            ? 'pt-6 border-t border-gray-200'
                                                            : ''
                                                    }
                                                >
                                                    <h4 className="text-sm font-semibold text-[#0E244D] mb-4">
                                                        {metalData.title}
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                                Karatage
                                                            </div>
                                                            <div className="text-lg font-semibold text-[#0E244D]">
                                                                {metalData.karatage}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                                Material Colour
                                                            </div>
                                                            <div className="text-lg font-semibold text-[#0E244D]">
                                                                {metalData.materialColour}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                                Gross Metal Weight
                                                            </div>
                                                            <div className="text-lg font-semibold text-[#0E244D]">
                                                                {metalData.grossMetalWeight}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                                Metal
                                                            </div>
                                                            <div className="text-lg font-semibold text-[#0E244D]">
                                                                {metalData.metal}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-500">
                                                No metal details available for this configuration.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    {/* Diamond Details Accordion */}
                    {selectedConfig && (
                            <div className="rounded-2xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => toggleSection('diamond')}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F8F5F0]/50 transition-colors"
                                >
                                    <h3 className="text-base font-semibold text-[#0E244D]">
                                        Diamond Details
                                    </h3>
                                    <svg
                                        className={`w-5 h-5 text-[#0E244D] transition-transform ${
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
                                    <div className="px-6 pb-6">
                                        {diamondData ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                        Diamond Quality
                                                    </div>
                                                    <div className="text-lg font-semibold text-[#0E244D]">
                                                        {diamondData.diamondQuality}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                        Diamond Shape
                                                    </div>
                                                    <div className="text-lg font-semibold text-[#0E244D]">
                                                        {diamondData.diamondShape}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                        Total Carat Weight
                                                    </div>
                                                    <div className="text-lg font-semibold text-[#0E244D]">
                                                        {diamondData.totalCaratWeight}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                                                        Number of Diamonds
                                                    </div>
                                                    <div className="text-lg font-semibold text-[#0E244D]">
                                                        {diamondData.numberOfDiamonds}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500">
                                                No diamond details available for this configuration.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}


                    {/* General Details Accordion */}
                    <div className="rounded-2xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection('general')}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F8F5F0]/50 transition-colors"
                        >
                            <h3 className="text-base font-semibold text-[#0E244D]">
                                General Details
                            </h3>
                            <svg
                                className={`w-5 h-5 text-[#0E244D] transition-transform ${
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
                            <div className="px-6 pb-6">
                                <div className="text-sm text-gray-600">
                                    General product information will be displayed here.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description Accordion */}
                    {productDescription && (
                        <div className="rounded-2xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleSection('description')}
                                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F8F5F0]/50 transition-colors"
                            >
                                <h3 className="text-base font-semibold text-[#0E244D]">
                                    Description
                                </h3>
                                <svg
                                    className={`w-5 h-5 text-[#0E244D] transition-transform ${
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
                                <div className="px-6 pb-6">
                                    <div 
                                        className="text-sm text-gray-700 leading-relaxed"
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
                <div className="rounded-2xl bg-white border border-[#0E244D]/10 shadow-sm p-6">
                    <h3 className="text-base font-semibold text-[#0E244D] mb-4">
                        Price Breakdown
                    </h3>
                    <div className="space-y-3">
                        {selectedConfig.price_breakup.metal > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Metal</span>
                                <span className="text-sm font-semibold text-[#0E244D]">
                                    ₹{selectedConfig.price_breakup.metal.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                        {selectedConfig.price_breakup.diamond > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Diamond</span>
                                <span className="text-sm font-semibold text-[#0E244D]">
                                    ₹{selectedConfig.price_breakup.diamond.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Making Charge</span>
                            <span className="text-sm font-semibold text-[#0E244D]">
                                ₹{selectedConfig.price_breakup.making.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 pt-3 mt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-base font-semibold text-[#0E244D]">
                                    Total
                                </span>
                                <span className="text-lg font-bold text-[#0E244D]">
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
