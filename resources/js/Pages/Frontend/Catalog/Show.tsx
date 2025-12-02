import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CustomizationSection from '@/Components/Customization/CustomizationSection';
import ProductDetailsPanel from '@/Components/Customization/ProductDetailsPanel';

type VariantMetadata = {
    auto_label?: string;
    diamond_option_key?: string | null;
    size_cm?: number | string | null;
    [key: string]: unknown;
};

type ProductVariant = {
    id: number;
    label: string;
    price_adjustment: number;
    is_default: boolean;
    metadata?: VariantMetadata | null;
    metals?: Array<{
        id: number;
        metal_id: number;
        metal_purity_id: number | null;
        metal_tone_id: number | null;
        weight_grams: number | null;
        metal: { id: number; name: string } | null;
        metal_purity: { id: number; name: string } | null;
        metal_tone: { id: number; name: string } | null;
    }>;
    diamonds?: Array<{
        id: number;
        diamond_type_id: number | null;
        diamond_clarity_id: number | null;
        diamond_color_id: number | null;
        diamond_shape_id: number | null;
        diamond_cut_id: number | null;
        diamonds_count: number | null;
        total_carat: number | null;
        diamond_type: { id: number; name: string } | null;
        diamond_clarity: { id: number; name: string } | null;
        diamond_color: { id: number; name: string } | null;
        diamond_shape: { id: number; name: string } | null;
        diamond_cut: { id: number; name: string } | null;
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
    gold_weight?: number | null;
    silver_weight?: number | null;
    other_material_weight?: number | null;
    total_weight?: number | null;
    base_price?: number;
    making_charge?: number;
    is_jobwork_allowed: boolean;
    uses_gold: boolean;
    uses_silver: boolean;
    uses_diamond: boolean;
    diamond_mixing_mode?: 'shared' | 'as_variant';
    mixed_metal_tones_per_purity?: boolean;
    mixed_metal_purities_per_tone?: boolean;
    metal_mix_mode?: Record<number, 'normal' | 'mix_tones' | 'mix_purities'>;
    media: Array<{ url: string; alt: string }>;
    variants: ProductVariant[];
};


// Configuration option types - one option per variant
interface ConfigMetal {
    label: string;        // e.g. "18K Yellow Gold 3.50g"
    metalId: number;
    metalPurityId: number | null;
    metalToneId: number | null;
    weightGrams?: string | null;
}

interface ConfigDiamond {
    label: string;        // e.g. "LG Oval F VVS1 EX 1.00ct (2)"
    diamondTypeId: number;
    diamondShapeId: number;
    diamondColorId: number;
    diamondClarityId: number;
    diamondCutId: number;
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
    inventory_quantity?: number;
}

type CatalogShowPageProps = AppPageProps<{
    mode: 'purchase' | 'jobwork';
    product: Product;
    configurationOptions: ConfigurationOption[];
}>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});


export default function CatalogShow() {
    const page = usePage<CatalogShowPageProps & { wishlist?: { product_ids?: number[] } }>();
    const { 
        mode, 
        product, 
        configurationOptions
    } = page.props;
    const wishlistProductIds = page.props.wishlist?.product_ids ?? [];
    const wishlistLookup = useMemo(() => new Set(wishlistProductIds), [wishlistProductIds]);

    // State for configuration selection
    // selectedVariantId is the key that drives all updates:
    // - Price/estimated total (via selectedConfig.price_total and price_breakup)
    // - Metals display (via selectedConfig.metals array)
    // - Diamonds display (via selectedConfig.diamonds array)
    // - Request quotation payload (via data.product_variant_id)
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        configurationOptions[0]?.variant_id ?? null
    );

    // Get selected configuration from the full options list
    // This selectedConfig object contains:
    // - price_total: used for estimated total calculation
    // - price_breakup: used for detailed price breakdown display
    // - metals: array of metal details (with weights) shown in "Metals in this variant"
    // - diamonds: array of diamond details shown in "Diamonds in this variant"
    // - variant_id: sent to backend in Request quotation API
    const selectedConfig = useMemo(
        () => configurationOptions.find((c) => c.variant_id === selectedVariantId) ?? null,
        [selectedVariantId, configurationOptions]
    );

    const [selectedMode] = useState<'purchase' | 'jobwork'>('purchase');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [quantityInput, setQuantityInput] = useState<string>('1');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const galleryRef = useRef<HTMLDivElement | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1.5);
    const mediaCount = product.media.length;
    const hasMedia = mediaCount > 0;
    const activeMedia = hasMedia
        ? product.media[Math.min(activeImageIndex, mediaCount - 1)]
        : null;
    const formatWeight = (value?: number | null) => {
        if (value === null || value === undefined) {
            return '—';
        }

        return `${value.toFixed(2)} g`;
    };
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    type QuotationFormData = {
        product_id: number;
        product_variant_id: number | null;
        mode: 'purchase' | 'jobwork';
        quantity: number;
        notes: string;
        selections: {
            metal_id: number | null | '';
            metal_purity_id: number | null | '';
            metal_tone_id: number | null | '';
            diamond_option_keys: string[];
            size_cm: string | null;
        };
    };

    const { data, setData, post, processing, errors } = useForm<QuotationFormData>({
        product_id: product.id,
        product_variant_id: selectedVariantId ?? null,
        mode: selectedMode,
        quantity: 1,
        notes: '',
        selections: {
            metal_id: null,
            metal_purity_id: null,
            metal_tone_id: null,
            diamond_option_keys: [],
            size_cm: null,
        },
    });

    useEffect(() => {
        setData('mode', selectedMode);
    }, [selectedMode, setData]);

    // Sync quantityInput with form data when variant changes
    useEffect(() => {
        setQuantityInput(String(data.quantity));
    }, [selectedVariantId, data.quantity]);

    const isJobworkMode = mode === 'jobwork';
    const jobworkNotAllowed = isJobworkMode && !product.is_jobwork_allowed;

    // Update form data when variant changes
    // This ensures the Request quotation API receives the correct variant_id
    // The form's product_variant_id is bound to selectedVariantId, so when user
    // selects a metal+diamond combination, the matching variant_id is automatically
    // set in the form payload
    useEffect(() => {
        setData('product_variant_id', selectedVariantId ?? null);
    }, [selectedVariantId, setData]);

    const [wishlistPending, setWishlistPending] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(wishlistLookup.has(product.id));

    useEffect(() => {
        setIsWishlisted(wishlistLookup.has(product.id));
    }, [wishlistLookup, product.id]);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [product.id]);

    useEffect(() => {
        if (activeImageIndex > mediaCount - 1) {
            setActiveImageIndex(Math.max(mediaCount - 1, 0));
        }
    }, [activeImageIndex, mediaCount]);



    // Calculate estimated total based on selectedVariant (via selectedConfig)
    // Price updates automatically when selectedVariantId changes because selectedConfig is a useMemo
    // that depends on selectedVariantId
    const estimatedTotal = useMemo(() => {
        if (!selectedConfig) {
            return 0;
        }
        
        if (isJobworkMode) {
            // For jobwork, only charge the making charge
            return selectedConfig.price_breakup.making + selectedConfig.price_breakup.adjustment;
        } else {
            // For purchase, use price_total from configuration
            return selectedConfig.price_total;
        }
    }, [selectedConfig, isJobworkMode]);


    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (processing || invalidCombination || jobworkNotAllowed) {
            return;
        }

        // Directly add to cart without modal
        const payload = {
            product_id: product.id,
            product_variant_id: data.product_variant_id,
            quantity: data.quantity,
            configuration: {
                mode: selectedMode,
                notes: data.notes,
                selections: data.selections,
            },
        };

        router.post(route('frontend.cart.items.store'), payload, {
            preserveScroll: true,
        });
    };

    const confirmSubmit = () => {
        if (processing || submitting) return;

        setSubmitting(true);
        post(route('frontend.quotations.store'), {
            preserveScroll: true,
            onSuccess: () => setConfirmOpen(false),
            onFinish: () => setSubmitting(false),
        });
    };

    const addToQuotationList = () => {
        const payload = {
            product_id: product.id,
            product_variant_id: data.product_variant_id,
            quantity: data.quantity,
            configuration: {
                mode,
                notes: data.notes,
                selections: data.selections,
            },
        };

        router.post(route('frontend.cart.items.store'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmOpen(false);
            },
        });
    };

    const toggleWishlist = () => {
        if (wishlistPending) {
            return;
        }

        setWishlistPending(true);

        if (isWishlisted) {
            router.delete(route('frontend.wishlist.items.destroy-by-product', product.id), {
                data: {
                    product_variant_id: data.product_variant_id,
                },
                preserveScroll: true,
                onFinish: () => setWishlistPending(false),
            });
        } else {
            router.post(
                route('frontend.wishlist.items.store'),
                {
                    product_id: product.id,
                    product_variant_id: data.product_variant_id,
                },
                {
                    preserveScroll: true,
                    onFinish: () => setWishlistPending(false),
                },
            );
        }
    };


    const openLightbox = useCallback(() => {
        if (hasMedia) {
            setLightboxOpen(true);
        }
    }, [hasMedia]);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
    }, []);

    const adjustLightboxZoom = useCallback((delta: number) => {
        setLightboxZoom((previous) => clamp(previous + delta, 1, 3));
    }, []);

    const resetLightboxZoom = useCallback(() => setLightboxZoom(1.5), []);

    const showPreviousImage = useCallback(() => {
        if (!hasMedia || mediaCount <= 1) {
            return;
        }

        setActiveImageIndex((index) => (index - 1 + mediaCount) % mediaCount);
    }, [hasMedia, mediaCount]);

    const showNextImage = useCallback(() => {
        if (!hasMedia || mediaCount <= 1) {
            return;
        }

        setActiveImageIndex((index) => (index + 1) % mediaCount);
    }, [hasMedia, mediaCount]);

    useEffect(() => {
        if (!lightboxOpen || typeof document === 'undefined') {
            return;
        }

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
        if (lightboxOpen) {
            resetLightboxZoom();
        }
    }, [activeImageIndex, lightboxOpen, resetLightboxZoom]);

    const invalidCombination = configurationOptions.length > 0 && !selectedConfig;
    
    // Check inventory availability
    const maxQuantity = selectedConfig?.inventory_quantity ?? null;
    const isOutOfStock = maxQuantity !== null && maxQuantity === 0;
    const currentQuantity = parseInt(quantityInput, 10) || 1;
    const quantityExceedsInventory = maxQuantity !== null && maxQuantity > 0 && currentQuantity > maxQuantity;
    const inventoryUnavailable = isOutOfStock || quantityExceedsInventory;

    // Sync quantityInput with form data when variant changes
    useEffect(() => {
        setQuantityInput(String(data.quantity));
    }, [selectedVariantId]);

    return (
        <AuthenticatedLayout>
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
                                            src={activeMedia?.url}
                                            alt={activeMedia?.alt ?? product.name}
                                            className="h-full w-full object-cover"
                                            onClick={openLightbox}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder-image.png';
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
                                                        src={media.url}
                                                        alt={media.alt ?? product.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = '/placeholder-image.png';
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Product Details Panel - Below images */}
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
                                    Select your configuration and our merchandising desk will share pricing shortly.
                                </p>
                            </div>

                            {/* Customization Section */}
                            {configurationOptions.length > 0 && (
                                <CustomizationSection
                                    configurationOptions={configurationOptions}
                                    selectedVariantId={selectedVariantId}
                                    onVariantChange={setSelectedVariantId}
                                />
                            )}

                            <label className="block space-y-1">
                                <span className="text-xs font-semibold text-slate-600">
                                    Quantity
                                    {maxQuantity !== null && maxQuantity > 0 && !quantityExceedsInventory && (
                                        <span className="ml-1 font-normal text-slate-500">
                                            (Available: {maxQuantity})
                                        </span>
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
                                        
                                        // Update form data if it's a valid number
                                        const numValue = parseInt(inputValue, 10);
                                        if (!isNaN(numValue) && numValue >= 1) {
                                            setData('quantity', numValue);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        // On blur, validate and set proper value
                                        const numValue = parseInt(quantityInput, 10);
                                        if (isNaN(numValue) || numValue < 1) {
                                            setQuantityInput('1');
                                            setData('quantity', 1);
                                        } else {
                                            setQuantityInput(String(numValue));
                                            setData('quantity', numValue);
                                        }
                                    }}
                                    className={`w-full rounded-2xl border px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                                        quantityExceedsInventory && !isOutOfStock
                                            ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-400/20'
                                            : 'border-slate-200 bg-white focus:border-feather-gold focus:ring-feather-gold/20'
                                    }`}
                                />
                                {errors.quantity && <span className="text-xs text-rose-500">{errors.quantity}</span>}
                                {quantityExceedsInventory && !isOutOfStock && !errors.quantity && maxQuantity !== null && (
                                    <span className="text-xs text-rose-500">
                                        Only {maxQuantity} {maxQuantity === 1 ? 'item is' : 'items are'} available. Maximum {maxQuantity} {maxQuantity === 1 ? 'item' : 'items'} allowed for request.
                                    </span>
                                )}
                            </label>

                            <label className="block space-y-1">
                                <span className="text-xs font-semibold text-slate-600">Notes (optional)</span>
                                <textarea
                                    rows={4}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    placeholder="List required scope: hallmarking, hallmark packaging, diamond certification, delivery deadlines…"
                                />
                                {errors.notes && <span className="text-xs text-rose-500">{errors.notes}</span>}
                            </label>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-700">Estimated total</p>
                                {selectedConfig ? (
                                    <>
                                        <p className="mt-1 text-xl font-semibold text-slate-900">
                                            {currencyFormatter.format(estimatedTotal)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {isJobworkMode
                                                ? 'Includes making charge only. Final quotation may vary with labour costs.'
                                                : 'Includes metal, diamond, making charge & adjustment. Final quotation may vary with bullion/diamond parity and labour.'}
                                        </p>
                                        {!isJobworkMode && (
                                            <div className="mt-2 space-y-1 text-xs">
                                                {selectedConfig.price_breakup.metal > 0 && (
                                                    <p className="flex justify-between">
                                                        <span>Metal:</span>
                                                        <span className="font-medium">{currencyFormatter.format(selectedConfig.price_breakup.metal)}</span>
                                                    </p>
                                                )}
                                                {selectedConfig.price_breakup.diamond > 0 && (
                                                    <p className="flex justify-between">
                                                        <span>Diamond:</span>
                                                        <span className="font-medium">{currencyFormatter.format(selectedConfig.price_breakup.diamond)}</span>
                                                    </p>
                                                )}
                                                <p className="flex justify-between">
                                                    <span>Making:</span>
                                                    <span className="font-medium">{currencyFormatter.format(selectedConfig.price_breakup.making)}</span>
                                                </p>
                                                {selectedConfig.price_breakup.adjustment !== 0 && (
                                                    <p className="flex justify-between">
                                                        <span>Adjustment:</span>
                                                        <span className="font-medium">{currencyFormatter.format(selectedConfig.price_breakup.adjustment)}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {isJobworkMode && (
                                            <div className="mt-2 space-y-1 text-xs">
                                                <p className="flex justify-between">
                                                    <span>Making charge:</span>
                                                    <span className="font-medium">{currencyFormatter.format(selectedConfig.price_breakup.making)}</span>
                                                </p>
                                                {selectedConfig.price_breakup.adjustment !== 0 && (
                                                    <p className="flex justify-between">
                                                        <span>Adjustment:</span>
                                                        <span className="font-medium">{currencyFormatter.format(selectedConfig.price_breakup.adjustment)}</span>
                                                    </p>
                                                )}
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
                                        <svg className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold">Out of Stock</p>
                                            <p className="text-xs mt-0.5">This product variant is currently out of stock. Quotation requests are not available.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={processing || invalidCombination || jobworkNotAllowed || inventoryUnavailable}
                                className="w-full rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Submitting…' : 'Request quotation'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-900">Confirm quotation</h3>
                        <p className="text-sm text-slate-600">
                            Submit this quotation request with the selected configuration? Our merchandising desk will review and respond
                            shortly.
                        </p>
                        <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                            <p><span className="font-semibold text-slate-700">Mode:</span> {mode === 'jobwork' ? 'Jobwork' : 'Jewellery'}</p>
                            <p>
                                <span className="font-semibold text-slate-700">Quantity:</span> {data.quantity}
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
                                {submitting ? 'Submitting…' : 'Confirm submission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
