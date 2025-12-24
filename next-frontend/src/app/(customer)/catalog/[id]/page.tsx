'use client';

import { useEffect, useMemo, useState, useCallback, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Head } from '@/components/Head';
import CustomizationSection from '@/components/ui/customization/CustomizationSection';
import ProductDetailsPanel from '@/components/ui/customization/ProductDetailsPanel';
import { frontendService } from '@/services/frontendService';
import { useCart } from '@/contexts/CartContext';
import { route } from '@/utils/route';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

type ConfigMetal = {
    label: string;
    metalId: number;
    metalPurityId: number | null;
    metalToneId: number | null;
    metalWeight?: string | null;
    metalName?: string;
    purityName?: string;
    toneName?: string;
};

type ConfigDiamond = {
    label: string;
    diamondShapeId: number;
    diamondColorId: number;
    diamondClarityId: number;
    stoneCount: number;
    totalCarat: string;
};

type ConfigurationOption = {
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
    inventory_quantity?: number | null;
    size?: {
        id: number;
        name: string;
        value?: string;
    } | null;
    metadata?: Record<string, unknown> | null;
};

type ProductVariant = {
    id: number;
    label: string;
    is_default: boolean;
    metadata?: Record<string, unknown> | null;
    metals?: Array<{
        id: number;
        metal_id: number;
        metal_purity_id: number | null;
        metal_tone_id: number | null;
        metal_weight: number | null;
        metal: { id: number; name: string } | null;
        metal_purity: { id: number; name: string } | null;
        metal_tone: { id: number; name: string } | null;
    }>;
    diamonds?: Array<{
        id: number;
        diamond_clarity_id: number | null;
        diamond_color_id: number | null;
        diamond_shape_id: number | null;
        diamonds_count: number | null;
        total_carat: number | null;
        diamond_clarity: { id: number; name: string } | null;
        diamond_color: { id: number; name: string } | null;
        diamond_shape: { id: number; name: string } | null;
    }>;
};

type Product = {
    id: number;
    name: string;
    sku: string;
    description?: string;
    brand?: string;
    material?: string;
    purity?: string;
    base_price?: number;
    making_charge_amount?: number;
    making_charge_percentage?: number | null;
    uses_gold: boolean;
    uses_silver: boolean;
    uses_diamond: boolean;
    category_sizes?: Array<{ id: number; name: string; code: string }>;
    media: Array<{ url: string; alt: string }>;
    variants: ProductVariant[];
};

const getMediaUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function CatalogShowPage() {
    const router = useRouter();
    const params = useParams();
    const productId = Number(params.id);
    const { refreshCart } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [configurationOptions, setConfigurationOptions] = useState<ConfigurationOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [quantityInput, setQuantityInput] = useState<string>('1');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [selectionState, setSelectionState] = useState<{
        metalId: number | '';
        purityId: number | '';
        toneId: number | '';
        size: string;
        hasSize: boolean;
    } | null>(null);
    const [validationErrors, setValidationErrors] = useState<{
        metal?: string;
        purity?: string;
        tone?: string;
        size?: string;
        quantity?: string;
        notes?: string;
    }>({});
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1.5);


    const selectedConfig = useMemo(
        () => configurationOptions.find((c) => c.variant_id === selectedVariantId) ?? null,
        [selectedVariantId, configurationOptions]
    );

    const mediaCount = product?.media.length || 0;
    const hasMedia = mediaCount > 0;
    const activeMedia = hasMedia && product
        ? product.media[Math.min(activeImageIndex, mediaCount - 1)]
        : null;

    useEffect(() => {
        if (!productId || isNaN(productId)) {
            setError('Invalid product ID');
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await frontendService.getProduct(productId);
                const data = response.data;
                
                // Map product data to match expected structure
                const mappedProduct: Product = {
                    id: Number(data.product.id),
                    name: data.product.name,
                    sku: data.product.sku,
                    description: data.product.description || undefined,
                    brand: data.product.brand || undefined,
                    material: data.product.material || undefined,
                    purity: data.product.purity || undefined,
                    base_price: data.product.base_price || 0,
                    making_charge_amount: data.product.making_charge_amount || 0,
                    making_charge_percentage: data.product.making_charge_percentage || null,
                    uses_gold: data.product.uses_gold || false,
                    uses_silver: data.product.uses_silver || false,
                    uses_diamond: data.product.uses_diamond || false,
                    category_sizes: (data.product.category_sizes || []).map((cs: any) => ({
                        id: Number(cs.id),
                        name: cs.name,
                        code: cs.code || cs.name,
                    })),
                    media: (data.product.media || []).map((m: any) => ({
                        url: getMediaUrl(m.url),
                        alt: m.alt || data.product.name,
                    })),
                    variants: (data.product.variants || []).map((v: any) => ({
                        id: Number(v.id),
                        label: v.label,
                        is_default: v.is_default || false,
                        metadata: v.metadata || {},
                        metals: (v.metals || []).map((m: any) => ({
                            id: Number(m.id),
                            metal_id: Number(m.metal_id),
                            metal_purity_id: m.metal_purity_id ? Number(m.metal_purity_id) : null,
                            metal_tone_id: m.metal_tone_id ? Number(m.metal_tone_id) : null,
                            metal_weight: m.metal_weight ? Number(m.metal_weight) : null,
                            metal: m.metal ? { id: Number(m.metal.id), name: m.metal.name } : null,
                            metal_purity: m.metal_purity ? { id: Number(m.metal_purity.id), name: m.metal_purity.name } : null,
                            metal_tone: m.metal_tone ? { id: Number(m.metal_tone.id), name: m.metal_tone.name } : null,
                        })),
                        diamonds: (v.diamonds || []).map((d: any) => ({
                            id: Number(d.id),
                            diamond_clarity_id: d.diamond_clarity_id ? Number(d.diamond_clarity_id) : null,
                            diamond_color_id: d.diamond_color_id ? Number(d.diamond_color_id) : null,
                            diamond_shape_id: d.diamond_shape_id ? Number(d.diamond_shape_id) : null,
                            diamonds_count: d.diamonds_count ? Number(d.diamonds_count) : null,
                            total_carat: d.total_carat ? Number(d.total_carat) : null,
                            diamond_clarity: d.diamond_clarity ? { id: Number(d.diamond_clarity.id), name: d.diamond_clarity.name } : null,
                            diamond_color: d.diamond_color ? { id: Number(d.diamond_color.id), name: d.diamond_color.name } : null,
                            diamond_shape: d.diamond_shape ? { id: Number(d.diamond_shape.id), name: d.diamond_shape.name } : null,
                        })),
                    })),
                };
                
                // Map configuration options
                const mappedConfigOptions: ConfigurationOption[] = (data.configurationOptions || []).map((opt: any) => ({
                    variant_id: Number(opt.variant_id),
                    label: opt.label || '',
                    metal_label: opt.metal_label || '',
                    diamond_label: opt.diamond_label || '',
                    metals: (opt.metals || []).map((m: any) => ({
                        label: m.label || `${m.purityName || ''} ${m.toneName || ''} ${m.metalName || ''} ${m.metalWeight ? m.metalWeight + 'g' : ''}`.trim() || 'Metal',
                        metalId: Number(m.metalId),
                        metalPurityId: m.metalPurityId ? Number(m.metalPurityId) : null,
                        metalToneId: m.metalToneId ? Number(m.metalToneId) : null,
                        metalWeight: m.metalWeight ? String(m.metalWeight) : null,
                        metalName: m.metalName,
                        purityName: m.purityName,
                        toneName: m.toneName,
                    })),
                    diamonds: (opt.diamonds || []).map((d: any) => ({
                        label: d.label || '',
                        diamondShapeId: Number(d.diamondShapeId || 0),
                        diamondColorId: Number(d.diamondColorId || 0),
                        diamondClarityId: Number(d.diamondClarityId || 0),
                        stoneCount: Number(d.stoneCount || 0),
                        totalCarat: String(d.totalCarat || '0'),
                    })) || [],
                    price_total: Number(opt.price_total || 0),
                    price_breakup: {
                        base: Number(opt.price_breakup?.base || 0),
                        metal: Number(opt.price_breakup?.metal || 0),
                        diamond: Number(opt.price_breakup?.diamond || 0),
                        making: Number(opt.price_breakup?.making || 0),
                    },
                    sku: opt.sku || mappedProduct.sku || '',
                    inventory_quantity: opt.inventory_quantity !== undefined ? Number(opt.inventory_quantity) : null,
                    size: opt.size ? {
                        id: Number(opt.size.id),
                        name: opt.size.name,
                        value: opt.size.value || opt.size.name,
                    } : null,
                    metadata: opt.metadata || null,
                }));
                
                setProduct(mappedProduct);
                setConfigurationOptions(mappedConfigOptions);
                
                if (mappedConfigOptions.length > 0) {
                    setSelectedVariantId(mappedConfigOptions[0].variant_id);
                }
            } catch (err: any) {
                console.error('Failed to fetch product:', err);
                setError(err.response?.data?.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    useEffect(() => {
        if (product) {
            setActiveImageIndex(0);
        }
    }, [product?.id]);

    useEffect(() => {
        if (activeImageIndex > mediaCount - 1) {
            setActiveImageIndex(Math.max(mediaCount - 1, 0));
        }
    }, [activeImageIndex, mediaCount]);

    // Sync quantityInput with quantity when variant changes
    useEffect(() => {
        setQuantityInput(String(quantity));
    }, [selectedVariantId, quantity]);

    const estimatedTotal = useMemo(() => {
        if (!selectedConfig) return 0;
        return selectedConfig.price_total;
    }, [selectedConfig]);

    const invalidCombination = configurationOptions.length > 0 && !selectedConfig;

    const maxQuantity = selectedConfig?.inventory_quantity ?? null;
    const isOutOfStock = maxQuantity !== null && maxQuantity === 0;
    const currentQuantity = parseInt(quantityInput, 10) || 1;
    const quantityExceedsInventory = maxQuantity !== null && maxQuantity > 0 && currentQuantity > maxQuantity;
    const inventoryUnavailable = isOutOfStock || quantityExceedsInventory;

    const validateSelections = () => {
        const errors: { metal?: string; purity?: string; tone?: string; size?: string } = {};
        
        if (!selectionState) {
            errors.metal = 'Please select Metal';
            errors.purity = 'Please select Purity';
            errors.tone = 'Please select Tone';
            const hasSize = configurationOptions.some(
                (opt) => opt.size?.value || opt.size?.name || opt.metadata?.size_value
            );
            if (hasSize) {
                errors.size = 'Please select Size';
            }
            return errors;
        }

        const { metalId, purityId, toneId, size, hasSize } = selectionState;
        
        if (!metalId) errors.metal = 'Please select Metal';
        if (!purityId) errors.purity = 'Please select Purity';
        if (!toneId) errors.tone = 'Please select Tone';
        if (hasSize && !size) errors.size = 'Please select Size';

        return errors;
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (processing || invalidCombination) {
            return;
        }

        // Validate selections
        const errors = validateSelections();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        if (!selectedVariantId) {
            return;
        }

        // Clear errors if validation passes
        setValidationErrors({});

        // Directly add to cart without modal
        setProcessing(true);
        frontendService.addToCart(
            product!.id,
            selectedVariantId,
            quantity,
            { notes }
        ).then(async () => {
            await refreshCart();
            setProcessing(false);
        }).catch((err: any) => {
            console.error('Failed to add to cart:', err);
            setProcessing(false);
        });
    };

    const confirmSubmit = async () => {
        if (processing || submitting) return;

        // Validate selections
        const errors = validateSelections();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        if (!selectedVariantId) {
            return;
        }

        // Clear errors if validation passes
        setValidationErrors({});

        setSubmitting(true);
        try {
            await frontendService.submitQuotationsFromCart();
            setConfirmOpen(false);
        } catch (err: any) {
            console.error('Failed to submit quotation:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const addToQuotationList = async () => {
        setProcessing(true);
        try {
            await frontendService.addToCart(
                product!.id,
                selectedVariantId!,
                quantity,
                { notes }
            );
            await refreshCart();
            setConfirmOpen(false);
        } catch (err: any) {
            console.error('Failed to add to cart:', err);
        } finally {
            setProcessing(false);
        }
    };

    const handleClearValidationError = useCallback((field: 'metal' | 'purity' | 'tone' | 'size') => {
        setValidationErrors((prev) => {
            const updated = { ...prev };
            delete updated[field];
            return updated;
        });
    }, []);

    const openLightbox = useCallback(() => {
        if (hasMedia) setLightboxOpen(true);
    }, [hasMedia]);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
    }, []);

    const resetLightboxZoom = useCallback(() => setLightboxZoom(1.5), []);

    const showPreviousImage = useCallback(() => {
        if (!hasMedia || mediaCount <= 1) return;
        setActiveImageIndex((index) => (index - 1 + mediaCount) % mediaCount);
    }, [hasMedia, mediaCount]);

    const showNextImage = useCallback(() => {
        if (!hasMedia || mediaCount <= 1) return;
        setActiveImageIndex((index) => (index + 1) % mediaCount);
    }, [hasMedia, mediaCount]);

    useEffect(() => {
        if (!lightboxOpen || typeof document === 'undefined') return;

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowRight') {
                showNextImage();
            } else if (event.key === 'ArrowLeft') {
                showPreviousImage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [lightboxOpen, closeLightbox, showNextImage, showPreviousImage]);

    useEffect(() => {
        if (lightboxOpen) resetLightboxZoom();
    }, [activeImageIndex, lightboxOpen, resetLightboxZoom]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{error || 'Product not found'}</p>
                    <Link href={route('frontend.catalog.index')} className="mt-4 text-sm text-elvee-blue hover:underline">
                        Back to catalog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={product.name} />

            <div className="space-y-8">
                <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <div className="mb-4">
                                <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                                {product.brand && (
                                    <p className="mt-1 text-sm text-slate-500">by {product.brand}</p>
                                )}
                            </div>

                            {hasMedia && (
                                <div className="relative mb-6">
                                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100">
                                        <img
                                            src={getMediaUrl(activeMedia?.url || '')}
                                            alt={activeMedia?.alt || product.name}
                                            className="h-full w-full cursor-pointer object-cover"
                                            onClick={openLightbox}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                            }}
                                        />
                                    </div>
                                    {mediaCount > 1 && (
                                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                            {product.media.map((media, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => setActiveImageIndex(index)}
                                                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                                                        index === activeImageIndex
                                                            ? 'border-feather-gold'
                                                            : 'border-transparent hover:border-slate-300'
                                                    }`}
                                                >
                                                    <img
                                                        src={getMediaUrl(media.url)}
                                                        alt={media.alt || product.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <ProductDetailsPanel
                                selectedConfig={selectedConfig}
                                productDescription={product.description}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <form
                            onSubmit={submit}
                            className="w-full space-y-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80"
                        >
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Request quotation
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Select your configuration and our
                                    merchandising desk will share pricing
                                    shortly.
                                </p>
                            </div>

                            {/* Customization Section */}
                            {configurationOptions.length > 0 && (
                                <>
                                    <CustomizationSection
                                        configurationOptions={configurationOptions}
                                        selectedVariantId={selectedVariantId}
                                        onVariantChange={setSelectedVariantId}
                                        onSelectionStateChange={setSelectionState}
                                        validationErrors={validationErrors}
                                        onClearValidationError={handleClearValidationError}
                                    />
                                </>
                            )}

                            <label className="block space-y-1">
                                <span className="text-xs font-semibold text-slate-600">
                                    Quantity
                                    {maxQuantity !== null && maxQuantity > 0 && !quantityExceedsInventory && (
                                        <span className="ml-1 font-normal text-slate-500">(Available: {maxQuantity})</span>
                                    )}
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    max={maxQuantity !== null && maxQuantity > 0 ? maxQuantity : undefined}
                                    value={quantityInput}
                                    onChange={(e) => {
                                        // Allow completely free typing
                                        const inputValue = e.target.value;
                                        setQuantityInput(inputValue);

                                        // Update quantity if it's a valid number
                                        const numValue = parseInt(inputValue, 10);
                                        if (!isNaN(numValue) && numValue >= 1) {
                                            setQuantity(numValue);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        // On blur, validate and set proper value
                                        const numValue = parseInt(quantityInput, 10);
                                        if (isNaN(numValue) || numValue < 1) {
                                            setQuantityInput('1');
                                            setQuantity(1);
                                        } else {
                                            setQuantityInput(String(numValue));
                                            setQuantity(numValue);
                                        }
                                    }}
                                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                                        quantityExceedsInventory && !isOutOfStock
                                            ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-400/20'
                                            : 'border-slate-200 bg-white focus:border-feather-gold focus:ring-feather-gold/20'
                                    }`}
                                />
                                {validationErrors.quantity && (
                                    <span className="text-xs text-rose-500">
                                        {validationErrors.quantity}
                                    </span>
                                )}
                                {quantityExceedsInventory &&
                                    !isOutOfStock &&
                                    !validationErrors.quantity &&
                                    maxQuantity !== null && (
                                        <span className="text-xs text-rose-500">
                                            Only {maxQuantity}{" "}
                                            {maxQuantity === 1
                                                ? "item is"
                                                : "items are"}{" "}
                                            available. Maximum {maxQuantity}{" "}
                                            {maxQuantity === 1
                                                ? "item"
                                                : "items"}{" "}
                                            allowed for request.
                                        </span>
                                    )}
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs font-semibold text-slate-600">Notes (optional)</span>
                                <textarea
                                    rows={4}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    placeholder="List required scope: hallmarking, hallmark packaging, diamond certification, delivery deadlines…"
                                />
                                {validationErrors.notes && (
                                    <span className="text-xs text-rose-500">
                                        {validationErrors.notes}
                                    </span>
                                )}
                            </label>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-700">Estimated total</p>
                                {selectedConfig ? (
                                    <>
                                        <p className="mt-1 text-xl font-semibold text-slate-900">
                                            {currencyFormatter.format(estimatedTotal)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Includes metal, diamond, and making charge. Final quotation may vary with bullion/diamond parity and labour.
                                        </p>
                                        {selectedConfig && (
                                            <div className="mt-2 space-y-1 text-xs">
                                                {selectedConfig.price_breakup.metal > 0 && (
                                                    <p className="flex justify-between">
                                                        <span>Metal:</span>
                                                        <span className="font-medium">
                                                            {currencyFormatter.format(selectedConfig.price_breakup.metal)}
                                                        </span>
                                                    </p>
                                                )}
                                                {selectedConfig.price_breakup.diamond > 0 && (
                                                    <p className="flex justify-between">
                                                        <span>Diamond:</span>
                                                        <span className="font-medium">
                                                            {currencyFormatter.format(selectedConfig.price_breakup.diamond)}
                                                        </span>
                                                    </p>
                                                )}
                                                <p className="flex justify-between">
                                                    <span>Making:</span>
                                                    <span className="font-medium">
                                                        {currencyFormatter.format(selectedConfig.price_breakup.making)}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="mt-1 text-sm text-rose-600">
                                        Please select a configuration to see pricing.
                                    </p>
                                )}
                            </div>

                            {isOutOfStock && (
                                <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    <div className="flex items-start gap-2">
                                        <svg
                                            className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div>
                                            <p className="font-semibold">Out of Stock</p>
                                            <p className="text-xs mt-0.5">
                                                This product variant is currently out of stock. Quotation requests are not available.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={processing || invalidCombination || inventoryUnavailable}
                                className="w-full rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing
                                    ? "Submitting…"
                                    : "Request quotation"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Confirm quotation
                        </h3>
                        <p className="text-sm text-slate-600">
                            Submit this quotation request with the selected
                            configuration? Our merchandising desk will review
                            and respond shortly.
                        </p>
                        <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                            <p>
                                <span className="font-semibold text-slate-700">
                                    Mode:
                                </span>{" "}
                            </p>
                            <p>
                                <span className="font-semibold text-slate-700">
                                    Quantity:
                                </span>{" "}
                                {quantity}
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-900"
                                onClick={() => setConfirmOpen(false)}
                                disabled={submitting}
                            >
                                Review again
                            </button>
                            <button
                                type="button"
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-900"
                                onClick={addToQuotationList}
                                disabled={submitting}
                            >
                                Add to quotation list
                            </button>
                            <button
                                type="button"
                                className="rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-elvee-blue/30 hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={confirmSubmit}
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Submitting…"
                                    : "Confirm submission"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {lightboxOpen && hasMedia && activeMedia && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
                    onClick={closeLightbox}
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            closeLightbox();
                        }}
                        className="absolute right-4 top-4 text-white hover:text-slate-300"
                    >
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    {mediaCount > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showPreviousImage();
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300"
                            >
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showNextImage();
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300"
                            >
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}
                    <img
                        src={getMediaUrl(activeMedia.url)}
                        alt={activeMedia.alt || product.name}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

