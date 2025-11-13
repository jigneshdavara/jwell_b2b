import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type VariantMetadata = {
    auto_label?: string;
    gold_purity_id?: number | null;
    silver_purity_id?: number | null;
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
    media: Array<{ url: string; alt: string }>;
    variants: ProductVariant[];
};

type OptionItem = {
    id: number;
    name: string;
};

type DiamondOption = {
    key: string;
    type_id?: number | null;
    shape_id?: number | null;
    color_id?: number | null;
    clarity_id?: number | null;
    cut_id?: number | null;
    weight?: number | null;
    label: string;
};

type CatalogShowPageProps = AppPageProps<{
    mode: 'purchase' | 'jobwork';
    product: Product;
    goldPurities: OptionItem[];
    silverPurities: OptionItem[];
    diamondOptions: DiamondOption[];
}>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const fallbackMeta = (metadata?: VariantMetadata | null) => ({
    gold_purity_id: typeof metadata?.gold_purity_id === 'number' ? metadata.gold_purity_id : null,
    silver_purity_id: typeof metadata?.silver_purity_id === 'number' ? metadata.silver_purity_id : null,
    diamond_option_key: typeof metadata?.diamond_option_key === 'string' ? metadata.diamond_option_key : null,
    size_cm:
        metadata?.size_cm !== undefined && metadata?.size_cm !== null
            ? typeof metadata.size_cm === 'number'
                ? metadata.size_cm.toString()
                : String(metadata.size_cm)
            : null,
    auto_label: typeof metadata?.auto_label === 'string' ? metadata.auto_label : null,
});

export default function CatalogShow() {
    const page = usePage<CatalogShowPageProps & { wishlist?: { product_ids?: number[] } }>();
    const { mode, product, goldPurities, silverPurities, diamondOptions } = page.props;
    const wishlistProductIds = page.props.wishlist?.product_ids ?? [];
    const wishlistLookup = useMemo(() => new Set(wishlistProductIds), [wishlistProductIds]);

    const defaultVariant = useMemo(
        () => product.variants.find((variant) => variant.is_default) ?? product.variants[0] ?? null,
        [product.variants],
    );

    const defaultMeta = fallbackMeta(defaultVariant?.metadata);

    const sizeOptions = useMemo(() => {
        const sizes = product.variants
            .map((variant) => fallbackMeta(variant.metadata).size_cm)
            .filter((value): value is string => value !== null && value !== undefined && value !== '');
        return Array.from(new Set(sizes));
    }, [product.variants]);

    const [selectedGoldPurity, setSelectedGoldPurity] = useState<number | ''>(
        product.uses_gold ? defaultMeta.gold_purity_id ?? '' : '',
    );
    const [selectedSilverPurity, setSelectedSilverPurity] = useState<number | ''>(
        product.uses_silver ? defaultMeta.silver_purity_id ?? '' : '',
    );
    const [selectedDiamondOption, setSelectedDiamondOption] = useState<string>(
        product.uses_diamond ? defaultMeta.diamond_option_key ?? '' : '',
    );
    const [selectedSize, setSelectedSize] = useState<string>(
        sizeOptions.length > 0 ? defaultMeta.size_cm ?? sizeOptions[0] : '',
    );
    const [selectedMode] = useState<'purchase' | 'jobwork'>('purchase');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
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
            gold_purity_id: number | null | '';
            silver_purity_id: number | null | '';
            diamond_option_key: string | null;
            size_cm: string | null;
        };
    };

    const { data, setData, post, processing, errors } = useForm<QuotationFormData>({
        product_id: product.id,
        product_variant_id: defaultVariant?.id ?? null,
        mode: selectedMode,
        quantity: 1,
        notes: '',
        selections: {
            gold_purity_id: selectedGoldPurity === '' ? null : selectedGoldPurity,
            silver_purity_id: selectedSilverPurity === '' ? null : selectedSilverPurity,
            diamond_option_key: selectedDiamondOption || null,
            size_cm: selectedSize || null,
        },
    });

    useEffect(() => {
        setData('mode', selectedMode);
    }, [selectedMode, setData]);

    const matchingVariant = useMemo(() => {
        return product.variants.find((variant) => {
            const meta = fallbackMeta(variant.metadata);

            if (product.uses_gold) {
                const variantGold = meta.gold_purity_id ?? null;
                const selectedGold = selectedGoldPurity === '' ? null : selectedGoldPurity;
                if (variantGold !== selectedGold) {
                    return false;
                }
            }

            if (product.uses_silver) {
                const variantSilver = meta.silver_purity_id ?? null;
                const selectedSilver = selectedSilverPurity === '' ? null : selectedSilverPurity;
                if (variantSilver !== selectedSilver) {
                    return false;
                }
            }

            if (product.uses_diamond) {
                const variantDiamond = meta.diamond_option_key ?? null;
                const selectedDiamond = selectedDiamondOption || null;
                if (variantDiamond !== selectedDiamond) {
                    return false;
                }
            }

            if (sizeOptions.length > 0) {
                const variantSize = meta.size_cm ?? null;
                const targetSize = selectedSize || null;
                if (variantSize !== targetSize) {
                    return false;
                }
            }

            return true;
        }) ?? null;
    }, [
        product.variants,
        product.uses_gold,
        product.uses_silver,
        product.uses_diamond,
        selectedGoldPurity,
        selectedSilverPurity,
        selectedDiamondOption,
        selectedSize,
        sizeOptions.length,
    ]);

    useEffect(() => {
        setData('product_variant_id', matchingVariant?.id ?? null);
    }, [matchingVariant, setData]);

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


    useEffect(() => {
        setData('selections', {
            gold_purity_id: selectedGoldPurity === '' ? null : selectedGoldPurity,
            silver_purity_id: selectedSilverPurity === '' ? null : selectedSilverPurity,
            diamond_option_key: selectedDiamondOption || null,
            size_cm: selectedSize || null,
        });
    }, [selectedGoldPurity, selectedSilverPurity, selectedDiamondOption, selectedSize, setData]);

    const isJobworkMode = selectedMode === 'jobwork';
    const jobworkNotAllowed = isJobworkMode && !product.is_jobwork_allowed;

    const estimatedTotal = useMemo(() => {
        if (isJobworkMode) {
            // For jobwork, only charge the making charge
            const making = product.making_charge ?? 0;
            const adjustment = matchingVariant?.price_adjustment ?? 0;
            return making + adjustment;
        } else {
            // For purchase, charge base + making
            const base = product.base_price ?? 0;
            const making = product.making_charge ?? 0;
            const adjustment = matchingVariant?.price_adjustment ?? 0;
            return base + making + adjustment;
        }
    }, [product.base_price, product.making_charge, matchingVariant, isJobworkMode]);

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

    const invalidCombination = product.variants.length > 0 && !matchingVariant;

    return (
        <AuthenticatedLayout>
            <Head title={product.name} />

            <div className="space-y-8">
                <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <div className="mb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-500">SKU {product.sku}</p>
                                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{product.name}</h1>
                                        <p className="mt-2 text-sm text-slate-500">By {product.brand ?? 'Elvee Atelier'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleWishlist}
                                        disabled={wishlistPending}
                                        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition ${
                                            isWishlisted
                                                ? 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700'
                                                : 'border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600'
                                        }`}
                                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
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
                            </div>
                            <div className="flex flex-col gap-4 md:flex-row">
                                {hasMedia && product.media.length > 1 && (
                                    <div className="order-last flex gap-2 overflow-x-auto md:order-first md:h-[28rem] md:w-24 md:flex-col md:overflow-y-auto">
                                        {product.media.map((media, index) => (
                                            <button
                                                key={`${media.url}-${index}`}
                                                type="button"
                                                onClick={() => setActiveImageIndex(index)}
                                                className={`relative flex h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border transition md:h-20 md:w-20 ${
                                                    activeImageIndex === index
                                                        ? 'border-sky-400 ring-2 ring-sky-100'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                                aria-label={`View image ${index + 1}`}
                                            >
                                                <img
                                                    src={media.url}
                                                    alt={media.alt}
                                                    className="h-full w-full object-cover"
                                                    draggable={false}
                                                />
                                                {activeImageIndex === index && (
                                                    <span className="absolute inset-0 border-2 border-sky-400/80" aria-hidden />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="relative flex-1">
                                    <div
                                        ref={galleryRef}
                                        className="group relative aspect-square overflow-hidden rounded-3xl bg-slate-100"
                                        onClick={openLightbox}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                openLightbox();
                                            }
                                        }}
                                        aria-label="Open product gallery"
                                    >
                                        {activeMedia ? (
                                            <img
                                                src={activeMedia.url}
                                                alt={activeMedia.alt}
                                                className="h-full w-full object-cover"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                                                Image coming soon
                                            </div>
                                        )}
                                        <span className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                            Click to view full screen
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openLightbox}
                                        className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                            className="h-4 w-4"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2m6 0h2a2 2 0 012 2v2m0 6v2a2 2 0 01-2 2h-2m-6 0H6a2 2 0 01-2-2v-2" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" />
                                        </svg>
                                        View fullscreen
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80">
                            <div className="mb-6">
                                <div className="text-right">
                                    <p className="text-xs font-medium text-slate-500">Base estimate</p>
                                    <p className="text-2xl font-semibold text-slate-900">
                                        {currencyFormatter.format(product.base_price ?? 0)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Making {currencyFormatter.format(product.making_charge ?? 0)}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm leading-7 text-slate-600 whitespace-pre-line">
                                {product.description?.trim() ? product.description : 'Detailed description coming soon.'}
                            </p>
                            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Material</dt>
                                    <dd className="mt-1 font-semibold text-slate-900">{product.material ?? 'Custom blend'}</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Purity</dt>
                                    <dd className="mt-1 font-semibold text-slate-900">{product.purity ?? 'On request'}</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Total weight</dt>
                                    <dd className="mt-1 font-semibold text-slate-900">{formatWeight(product.total_weight)}</dd>
                                </div>
                            </dl>
                            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Gold weight</dt>
                                    <dd className="mt-1 font-semibold text-slate-900">{formatWeight(product.gold_weight)}</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Silver weight</dt>
                                    <dd className="mt-1 font-semibold text-slate-900">{formatWeight(product.silver_weight)}</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Other materials</dt>
                                    <dd className="mt-1 font-semibold text-slate-900">
                                        {formatWeight(product.other_material_weight)}
                                    </dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Jobwork ready</dt>
                                    <dd className="mt-1 font-semibold text-slate-900">
                                        {product.is_jobwork_allowed ? 'Yes' : 'On request'}
                                    </dd>
                                </div>
                            </dl>
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

                            {product.uses_gold && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-600">Gold purity</p>
                                    <div className="flex flex-wrap gap-2">
                                        {goldPurities.map((purity) => (
                                            <button
                                                key={purity.id}
                                                type="button"
                                                onClick={() => setSelectedGoldPurity(purity.id)}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                    selectedGoldPurity === purity.id
                                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {purity.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.uses_silver && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-600">Silver purity</p>
                                    <div className="flex flex-wrap gap-2">
                                        {silverPurities.map((purity) => (
                                            <button
                                                key={purity.id}
                                                type="button"
                                                onClick={() => setSelectedSilverPurity(purity.id)}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                    selectedSilverPurity === purity.id
                                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {purity.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.uses_diamond && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-600">Diamond mix</p>
                                    <div className="grid gap-2">
                                        {diamondOptions.map((option) => (
                                            <label
                                                key={option.key}
                                                className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                                                    selectedDiamondOption === option.key
                                                        ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                                }`}
                                            >
                                                <span>{option.label}</span>
                                                <input
                                                    type="radio"
                                                    name="diamond_option_key"
                                                    value={option.key}
                                                    checked={selectedDiamondOption === option.key}
                                                    onChange={() => setSelectedDiamondOption(option.key)}
                                                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                                                />
                                            </label>
                                        ))}
                                        {diamondOptions.length === 0 && (
                                            <p className="text-xs text-slate-400">No predefined diamond mixes for this design.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {sizeOptions.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-600">Size (cm)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {sizeOptions.map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setSelectedSize(size)}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                    selectedSize === size
                                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {invalidCombination && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                    No variant is available for the selected combination. Adjust purity, mix, or size to continue.
                                </div>
                            )}

                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Quantity</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={data.quantity}
                                    onChange={(event) => {
                                        const next = Number(event.target.value);
                                        setData('quantity', Number.isFinite(next) && next > 0 ? Math.floor(next) : 1);
                                    }}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                                {errors.quantity && <span className="text-xs text-rose-500">{errors.quantity}</span>}
                            </label>

                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Notes for merchandising team</span>
                                <textarea
                                    value={data.notes}
                                    onChange={(event) => setData('notes', event.target.value)}
                                    className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    placeholder="List required scope: hallmarking, hallmark packaging, diamond certification, delivery deadlines…"
                                />
                                {errors.notes && <span className="text-xs text-rose-500">{errors.notes}</span>}
                            </label>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-700">Estimated total</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">
                                    {currencyFormatter.format(estimatedTotal)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {isJobworkMode
                                        ? 'Includes making charge only. Final quotation may vary with labour costs.'
                                        : 'Includes base & making. Final quotation may vary with bullion/diamond parity and labour.'}
                                </p>
                                {!isJobworkMode && (
                                    <div className="mt-2 space-y-1 text-xs">
                                        <p className="flex justify-between">
                                            <span>Base:</span>
                                            <span className="font-medium">{currencyFormatter.format(product.base_price ?? 0)}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span>Making:</span>
                                            <span className="font-medium">{currencyFormatter.format(product.making_charge ?? 0)}</span>
                                        </p>
                                    </div>
                                )}
                                {isJobworkMode && (
                                    <div className="mt-2 space-y-1 text-xs">
                                        <p className="flex justify-between">
                                            <span>Making charge:</span>
                                            <span className="font-medium">{currencyFormatter.format(product.making_charge ?? 0)}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing || invalidCombination || jobworkNotAllowed}
                                className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Add to quotation
                            </button>
                        </form>

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h3 className="text-sm font-semibold text-slate-700">Next steps</h3>
                            <p className="mt-3 text-sm text-slate-600">
                                Our merchandising team will review the configuration and share pricing or follow-up questions by email.
                                Once you approve, the request moves to production and appears in your {mode === 'jobwork' ? 'jobwork timeline' : 'orders dashboard'}.
                            </p>
                            <Link
                                href={route('frontend.quotations.index')}
                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500"
                            >
                                View all quotations
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M21 12H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {lightboxOpen && activeMedia && (
                <div className="fixed inset-0 z-[70] flex flex-col bg-slate-950/95">
                    <div className="flex items-center justify-between px-6 py-4 text-white">
                        <div>
                            <p className="text-sm font-medium text-white/70">
                                Image {activeImageIndex + 1} of {product.media.length}
                            </p>
                            <p className="text-lg font-semibold">{product.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => adjustLightboxZoom(-0.2)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-lg font-semibold text-white transition hover:bg-white/10"
                                aria-label="Zoom out"
                            >
                                –
                            </button>
                            <span className="text-sm font-medium text-white/70">
                                {Math.round(lightboxZoom * 100)}%
                            </span>
                            <button
                                type="button"
                                onClick={() => adjustLightboxZoom(0.2)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-lg font-semibold text-white transition hover:bg-white/10"
                                aria-label="Zoom in"
                            >
                                +
                            </button>
                            <button
                                type="button"
                                onClick={resetLightboxZoom}
                                className="rounded-full border border-white/20 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={closeLightbox}
                                className="rounded-full border border-white/20 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="relative flex-1 overflow-hidden">
                        {product.media.length > 1 && (
                            <>
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
                                    <button
                                        type="button"
                                        onClick={showPreviousImage}
                                        className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                                        aria-label="Previous image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6">
                                    <button
                                        type="button"
                                        onClick={showNextImage}
                                        className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                                        aria-label="Next image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                        <div className="flex h-full w-full items-center justify-center overflow-auto px-10 pb-12">
                            <img
                                src={activeMedia.url}
                                alt={activeMedia.alt}
                                style={{ transform: `scale(${lightboxZoom})` }}
                                className="max-h-[90vh] max-w-full select-none object-contain transition-transform duration-200"
                                draggable={false}
                            />
                        </div>
                    </div>
                </div>
            )}
            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
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
                                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sky-600/30 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
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

