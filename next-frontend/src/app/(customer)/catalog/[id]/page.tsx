'use client';

import { useEffect, useMemo, useState, useCallback, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Head } from '@/components/Head';
import CustomizationSection from '@/components/ui/customization/CustomizationSection';
import ProductDetailsPanel from '@/components/ui/customization/ProductDetailsPanel';
import { frontendService } from '@/services/frontendService';
import { useAppDispatch } from '@/store/hooks';
import { fetchCart } from '@/store/slices/cartSlice';
import { route } from '@/utils/route';
import { getMediaUrl } from '@/utils/mediaUrl';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

import type { ProductDetail, ProductVariant, ConfigurationOption, ConfigMetal, ConfigDiamond } from '@/types';


export default function CatalogShowPage() {
    const router = useRouter();
    const params = useParams();
    const productId = Number(params.id);
    const dispatch = useAppDispatch();
    const refreshCart = () => dispatch(fetchCart());

    const [product, setProduct] = useState<ProductDetail | null>(null);
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

    const mediaCount = product?.media?.length || 0;
    const hasMedia = mediaCount > 0;
    const activeMedia = hasMedia && product && product.media
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
                const mappedProduct: ProductDetail = {
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

            <div className="w-full space-y-6 sm:space-y-8">
                <div className="grid w-full gap-6 sm:gap-8 lg:grid-cols-[1.6fr_1fr]">
                    <div className="w-full space-y-4 sm:space-y-6">
                        <div className="w-full rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80 sm:rounded-3xl sm:p-6">
                            <div className="mb-3 sm:mb-4">
                                <h1 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">{product.name}</h1>
                                {product.brand && (
                                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">by {product.brand}</p>
                                )}
                            </div>

                            {hasMedia && (
                                <div className="relative mb-4 sm:mb-6">
                                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 sm:rounded-2xl">
                                        <img
                                            src={getMediaUrl(activeMedia?.url || '')}
                                            alt={activeMedia?.alt || product.name}
                                            className="h-full w-full cursor-pointer object-cover transition active:scale-[0.98]"
                                            onClick={openLightbox}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                            }}
                                        />
                                    </div>
                                    {mediaCount > 1 && (
                                        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-2 sm:mt-4 sm:gap-2">
                                            {product.media?.map((media: { url: string; alt: string }, index: number) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => setActiveImageIndex(index)}
                                                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition active:scale-[0.95] sm:h-20 sm:w-20 sm:rounded-xl ${
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

                    <div className="w-full space-y-4 sm:space-y-6">
                        <form
                            onSubmit={submit}
                            className="w-full space-y-4 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80 sm:rounded-3xl sm:space-y-5 sm:p-6"
                        >
                            <div>
                                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                                    Request quotation
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 sm:mt-1.5">
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

                            <label className="block w-full space-y-1">
                                <span className="text-xs font-semibold text-slate-600 sm:text-sm">
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
                                    className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 sm:rounded-2xl sm:px-4 sm:py-2.5 ${
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

                            <label className="block w-full space-y-1">
                                <span className="text-xs font-semibold text-slate-600 sm:text-sm">Notes (optional)</span>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4 sm:py-2.5 sm:rows-4"
                                    placeholder="List required scope: hallmarking, hallmark packaging, diamond certification, delivery deadlines…"
                                />
                                {validationErrors.notes && (
                                    <span className="text-xs text-rose-500">
                                        {validationErrors.notes}
                                    </span>
                                )}
                            </label>

                            <div className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                                <p className="font-semibold text-slate-700">Estimated total</p>
                                {selectedConfig ? (
                                    <>
                                        <p className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
                                            {currencyFormatter.format(estimatedTotal)}
                                        </p>
                                        <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                                            Includes metal, diamond, and making charge. Final quotation may vary with bullion/diamond parity and labour.
                                        </p>
                                        {selectedConfig && (
                                            <div className="mt-2 space-y-0.5 text-[10px] sm:mt-2 sm:space-y-1 sm:text-xs">
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
                                    <p className="mt-1 text-xs text-rose-600 sm:text-sm">
                                        Please select a configuration to see pricing.
                                    </p>
                                )}
                            </div>

                            {isOutOfStock && (
                                <div className="w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                                    <div className="flex items-start gap-2">
                                        <svg
                                            className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5 sm:h-5 sm:w-5"
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
                                            <p className="text-xs font-semibold sm:text-sm">Out of Stock</p>
                                            <p className="mt-0.5 text-[10px] sm:text-xs">
                                                This product variant is currently out of stock. Quotation requests are not available.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={processing || invalidCombination || inventoryUnavailable}
                                className="w-full rounded-full bg-elvee-blue px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-2 sm:px-4">
                    <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-4 shadow-2xl sm:space-y-4 sm:rounded-3xl sm:p-6">
                        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                            Confirm quotation
                        </h3>
                        <p className="text-xs text-slate-600 sm:text-sm">
                            Submit this quotation request with the selected
                            configuration? Our merchandising desk will review
                            and respond shortly.
                        </p>
                        <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 sm:space-y-2 sm:rounded-2xl sm:p-4">
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
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                            <button
                                type="button"
                                className="w-full rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                                onClick={() => setConfirmOpen(false)}
                                disabled={submitting}
                            >
                                Review again
                            </button>
                            <button
                                type="button"
                                className="w-full rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                                onClick={addToQuotationList}
                                disabled={submitting}
                            >
                                Add to quotation list
                            </button>
                            <button
                                type="button"
                                className="w-full rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
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

