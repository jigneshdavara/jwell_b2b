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

    const individualMetalData = useMemo(() => {
        if (!selectedConfig || !selectedConfig.metals || selectedConfig.metals.length === 0) return [];
        return selectedConfig.metals.map((metal) => {
            const karatage = (metal as any).purityName || metal.label.match(/(\d+K|\d{3})/i)?.[1]?.toUpperCase() || '—';
            const materialColour = (metal as any).toneName || '—';
            let grossMetalWeight = '—';
            if (metal.metalWeight) {
                const parsed = parseFloat(metal.metalWeight);
                if (!isNaN(parsed) && parsed > 0) {
                    grossMetalWeight = parsed % 1 === 0 ? `${parsed.toFixed(0)} g` : `${parsed.toFixed(2)} g`;
                }
            }
            const metalType = (metal as any).metalName || 
                (metal.label.toLowerCase().includes('gold') ? 'Gold' : metal.label.toLowerCase().includes('silver') ? 'Silver' : '—');
            const cleanLabel = metal.label.replace(/\s+\d+\.?\d*\s*g\s*$/i, '').trim();
            return { id: metal.metalId, title: cleanLabel, karatage, materialColour, grossMetalWeight, metal: metalType };
        });
    }, [selectedConfig]);

    const individualDiamondData = useMemo(() => {
        if (!selectedConfig || !selectedConfig.diamonds || selectedConfig.diamonds.length === 0) return [];
        return selectedConfig.diamonds.map((diamond) => {
            const parts = diamond.label.split(' ').filter(p => !p.match(/^\d+\.\d+ct$/i) && !p.match(/^\(\d+\)$/));
            const diamondQuality = parts.slice(0, 4).join(' ');
            const carat = parseFloat(diamond.totalCarat || '0');
            const caratWeight = !isNaN(carat) && carat > 0 ? `${carat.toFixed(2)} ct` : '—';
            return { id: diamond.diamondShapeId, diamondQuality, diamondShape: '—', caratWeight, numberOfDiamonds: diamond.stoneCount.toString() };
        });
    }, [selectedConfig]);

    return (
        <div className="mt-6 space-y-4">
            <div className="flex border-b border-[#0E244D]/20">
                <button type="button" onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'details' ? 'text-[#0E244D] border-b-2 border-[#0E244D]' : 'text-gray-500'}`}>Product Details</button>
                <button type="button" onClick={() => setActiveTab('price')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'price' ? 'text-[#0E244D] border-b-2 border-[#0E244D]' : 'text-gray-500'}`}>Price Breakup</button>
            </div>

            {activeTab === 'details' && (
                <div className="space-y-4">
                    {selectedConfig && (
                        <div className="rounded-2xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden">
                            <button type="button" onClick={() => toggleSection('metal')} className="w-full flex items-center justify-between px-6 py-4">
                                <h3 className="text-base font-semibold text-[#0E244D]">Metal Details</h3>
                                <svg className={`w-5 h-5 text-[#0E244D] transition-transform ${expandedSections.has('metal') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={2} /></svg>
                            </button>
                            {expandedSections.has('metal') && (
                                <div className="px-6 pb-6 space-y-6">
                                    {individualMetalData.map((m, i) => (
                                        <div key={m.id} className={i > 0 ? 'pt-6 border-t border-gray-200' : ''}>
                                            <h4 className="text-sm font-semibold text-[#0E244D] mb-4">{m.title}</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><div className="text-gray-500 text-[11px] uppercase">Karatage</div><div className="font-semibold">{m.karatage}</div></div>
                                                <div><div className="text-gray-500 text-[11px] uppercase">Weight</div><div className="font-semibold">{m.grossMetalWeight}</div></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {productDescription && (
                        <div className="rounded-2xl bg-white border border-[#0E244D]/10 shadow-sm overflow-hidden">
                            <button type="button" onClick={() => toggleSection('description')} className="w-full flex items-center justify-between px-6 py-4">
                                <h3 className="text-base font-semibold text-[#0E244D]">Description</h3>
                                <svg className={`w-5 h-5 text-[#0E244D] transition-transform ${expandedSections.has('description') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={2} /></svg>
                            </button>
                            {expandedSections.has('description') && <div className="px-6 pb-6 text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: productDescription }} />}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'price' && selectedConfig && (
                <div className="rounded-2xl bg-white border border-[#0E244D]/10 shadow-sm p-6 space-y-3">
                    <h3 className="text-base font-semibold text-[#0E244D] mb-4">Price Breakdown</h3>
                    {selectedConfig.price_breakup.metal > 0 && <div className="flex justify-between"><span>Metal</span><span className="font-semibold">₹{selectedConfig.price_breakup.metal.toLocaleString('en-IN')}</span></div>}
                    <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3"><span>Total</span><span>₹{selectedConfig.price_total.toLocaleString('en-IN')}</span></div>
                </div>
            )}
        </div>
    );
}

