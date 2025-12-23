'use client';

import { useEffect, useMemo, useState, useCallback, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AuthenticatedLayout from '@/components/shared/AuthenticatedLayout';
import CustomizationSection from '@/components/ui/customization/CustomizationSection';
import ProductDetailsPanel from '@/components/ui/customization/ProductDetailsPanel';
import { frontendService } from '@/services/frontendService';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { route } from '@/utils/route';
import FlashMessage from '@/components/shared/FlashMessage';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

type ConfigMetal = {
    metalId: number;
    metalPurityId: number | null;
    metalToneId: number | null;
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
    label?: string;
    metal_label?: string;
    diamond_label?: string;
    metals: ConfigMetal[];
    diamonds?: ConfigDiamond[];
    price_total: number;
    price_breakup: {
        base: number;
        metal: number;
        diamond: number;
        making: number;
    };
    sku?: string;
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
    const { wishlistProductIds, addProductId, removeProductId, refreshWishlist } = useWishlist();
    const { refreshCart } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [configurationOptions, setConfigurationOptions] = useState<ConfigurationOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
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
    const [wishlistPending, setWishlistPending] = useState(false);
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const wishlistLookup = useMemo(() => new Set(wishlistProductIds), [wishlistProductIds]);
    const isWishlisted = useMemo(() => product ? wishlistLookup.has(product.id) : false, [wishlistLookup, product]);

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
                
                setProduct(data.product);
                setConfigurationOptions(data.configurationOptions || []);
                
                if (data.configurationOptions && data.configurationOptions.length > 0) {
                    setSelectedVariantId(data.configurationOptions[0].variant_id);
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
        if (product && activeImageIndex > mediaCount - 1) {
            setActiveImageIndex(Math.max(mediaCount - 1, 0));
        }
    }, [activeImageIndex, mediaCount, product]);

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

    const handleAddToCart = async () => {
        if (processing || invalidCombination) return;

        const errors = validateSelections();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        if (!selectedVariantId || !product) return;

        setValidationErrors({});

        try {
            await frontendService.addToCart(
                product.id,
                selectedVariantId,
                quantity,
                { notes }
            );
            await refreshCart();
            setFlashMessage({ type: 'success', message: 'Added to your quotation list.' });
            setTimeout(() => setFlashMessage(null), 3000);
        } catch (err: any) {
            console.error('Failed to add to cart:', err);
            setFlashMessage({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to add to cart. Please try again.' 
            });
            setTimeout(() => setFlashMessage(null), 3000);
        }
    };

    const handleSubmitQuotation = async () => {
        if (processing || submitting) return;

        const errors = validateSelections();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        if (!selectedVariantId || !product) return;

        setValidationErrors({});
        setSubmitting(true);

        try {
            await frontendService.submitQuotationsFromCart();
            setConfirmOpen(false);
            setFlashMessage({ type: 'success', message: 'Quotation request submitted successfully.' });
            setTimeout(() => {
                router.push(route('frontend.quotations.index'));
            }, 1500);
        } catch (err: any) {
            console.error('Failed to submit quotation:', err);
            setFlashMessage({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to submit quotation. Please try again.' 
            });
            setTimeout(() => setFlashMessage(null), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleWishlist = async () => {
        if (!product || wishlistPending) return;
        setWishlistPending(true);

        try {
            if (isWishlisted) {
                await frontendService.removeFromWishlistByProduct(product.id, selectedVariantId);
                removeProductId(product.id);
                await refreshWishlist();
                setFlashMessage({ type: 'success', message: 'Removed from wishlist.' });
            } else {
                await frontendService.addToWishlist({
                    product_id: product.id,
                    product_variant_id: selectedVariantId ?? undefined,
                });
                addProductId(product.id);
                await refreshWishlist();
                setFlashMessage({ type: 'success', message: 'Saved to your wishlist.' });
            }
            setTimeout(() => setFlashMessage(null), 3000);
        } catch (err: any) {
            console.error('Error toggling wishlist:', err);
            setFlashMessage({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to update wishlist. Please try again.' 
            });
            setTimeout(() => setFlashMessage(null), 3000);
        } finally {
            setWishlistPending(false);
        }
    };

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

    const processing = submitting || wishlistPending;

    if (loading) {
        return (
            <AuthenticatedLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
                </div>
            </AuthenticatedLayout>
        );
    }

    if (error || !product) {
        return (
            <AuthenticatedLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <p className="text-lg font-semibold text-slate-900">{error || 'Product not found'}</p>
                        <Link href={route('frontend.catalog.index')} className="mt-4 text-sm text-elvee-blue hover:underline">
                            Back to catalog
                        </Link>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            {flashMessage && (
                <div className="mb-6">
                    <FlashMessage type={flashMessage.type} message={flashMessage.message} />
                </div>
            )}

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
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAddToCart();
                            }}
                            className="w-full space-y-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Request quotation</h2>
                                    <p className="text-xs text-slate-500">
                                        Select your configuration and our merchandising desk will share pricing shortly.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleWishlist}
                                    disabled={wishlistPending}
                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
                                        isWishlisted
                                            ? 'border-rose-200 bg-rose-500/10 text-rose-500'
                                            : 'border-slate-300 bg-white text-slate-600 hover:text-rose-500'
                                    } ${wishlistPending ? 'opacity-60' : ''}`}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill={isWishlisted ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        className="h-5 w-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 5.053 7.5 10.5 9 10.5s9-5.447 9-10.5z"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {configurationOptions.length > 0 && (
                                <CustomizationSection
                                    configurationOptions={configurationOptions}
                                    selectedVariantId={selectedVariantId}
                                    onVariantChange={setSelectedVariantId}
                                    onSelectionStateChange={setSelectionState}
                                    validationErrors={validationErrors}
                                    onClearValidationError={(field) => {
                                        setValidationErrors((prev) => {
                                            const updated = { ...prev };
                                            delete updated[field];
                                            return updated;
                                        });
                                    }}
                                />
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
                                        const inputValue = e.target.value;
                                        setQuantityInput(inputValue);
                                        const numValue = parseInt(inputValue, 10);
                                        if (!isNaN(numValue) && numValue >= 1) {
                                            setQuantity(numValue);
                                        }
                                    }}
                                    onBlur={(e) => {
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
                                    <span className="text-xs text-rose-500">{validationErrors.quantity}</span>
                                )}
                                {quantityExceedsInventory && !isOutOfStock && !validationErrors.quantity && maxQuantity !== null && (
                                    <span className="text-xs text-rose-500">
                                        Only {maxQuantity} {maxQuantity === 1 ? 'item is' : 'items are'} available. Maximum {maxQuantity}{' '}
                                        {maxQuantity === 1 ? 'item' : 'items'} allowed for request.
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
                                    <span className="text-xs text-rose-500">{validationErrors.notes}</span>
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
                                {processing ? 'Submitting…' : 'Add to quotation list'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

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
        </AuthenticatedLayout>
    );
}

