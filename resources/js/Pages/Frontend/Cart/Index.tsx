import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';

type PriceBreakdown = {
    metal?: number;
    diamond?: number;
    making?: number;
    adjustment?: number;
    subtotal?: number;
    discount?: number;
    total?: number;
    discount_details?: {
        amount: number;
        type: 'percentage' | 'fixed' | null;
        value: number;
        source?: string | null;
        name?: string | null;
    } | null;
};

type CartItem = {
    id: number;
    product_id: number;
    product_variant_id?: number | null;
    sku: string;
    name: string;
    quantity: number;
    inventory_quantity?: number | null;
    unit_total: number;
    line_total: number;
    line_subtotal?: number;
    line_discount?: number;
    price_breakdown: PriceBreakdown;
    thumbnail?: string | null;
    variant_label?: string | null;
    configuration?: {
        mode?: 'purchase' | 'jobwork';
        notes?: string | null;
        selections?: Record<string, unknown> | null;
    };
};

type CartPageProps = PageProps<{
    cart: {
        items: CartItem[];
        currency: string;
        subtotal: number;
        tax: number;
        discount: number;
        shipping: number;
        total: number;
    };
}>;

const currencyFormatter = (currency: string) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    });

export default function CartIndex() {
    const { cart } = usePage<CartPageProps>().props;
    const formatter = useMemo(() => currencyFormatter(cart.currency || 'INR'), [cart.currency]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notesModalOpen, setNotesModalOpen] = useState<number | null>(null);
    const [notesValue, setNotesValue] = useState<Record<number, string>>({});
    const [inventoryErrors, setInventoryErrors] = useState<string[]>([]);
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<CartItem | null>(null);
    const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
    const [updatingQuantities, setUpdatingQuantities] = useState<Set<number>>(new Set());
    
    // Pagination state
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    const totalQuantity = useMemo(() => cart.items.reduce((sum, item) => sum + item.quantity, 0), [cart.items]);
    const jobworkCount = useMemo(
        () => cart.items.filter((item) => (item.configuration?.mode ?? 'purchase') === 'jobwork').length,
        [cart.items],
    );
    
    // Group items by product, then merge identical variants
    const groupedProducts = useMemo(() => {
        const grouped = new Map<number, { product: CartItem; variants: Map<string, CartItem & { mergedItemIds: number[] }> }>();
        
        cart.items.forEach((item) => {
            if (!grouped.has(item.product_id)) {
                // Use first item as the product representative
                const variantKey = `${item.product_variant_id ?? 'null'}_${JSON.stringify(item.configuration ?? {})}`;
                const variantsMap = new Map<string, CartItem & { mergedItemIds: number[] }>();
                variantsMap.set(variantKey, { ...item, mergedItemIds: [item.id] });
                
                grouped.set(item.product_id, {
                    product: item,
                    variants: variantsMap,
                });
            } else {
                const group = grouped.get(item.product_id)!;
                // Create a unique key for this variant (variant_id + configuration)
                const variantKey = `${item.product_variant_id ?? 'null'}_${JSON.stringify(item.configuration ?? {})}`;
                
                if (group.variants.has(variantKey)) {
                    // Merge with existing variant: add quantities and totals
                    const existing = group.variants.get(variantKey)!;
                    existing.quantity += item.quantity;
                    existing.line_total += item.line_total;
                    existing.line_subtotal = (existing.line_subtotal ?? 0) + (item.line_subtotal ?? item.line_total);
                    existing.line_discount = (existing.line_discount ?? 0) + (item.line_discount ?? 0);
                    existing.mergedItemIds.push(item.id);
                } else {
                    // New variant
                    group.variants.set(variantKey, { ...item, mergedItemIds: [item.id] });
                }
            }
        });
        
        // Convert Map to Array and calculate unit_total for merged variants
        return Array.from(grouped.values()).map(group => ({
            product: group.product,
            variants: Array.from(group.variants.values()).map(variant => {
                // Recalculate unit_total based on merged quantity and line_total
                const unitTotal = variant.quantity > 0 ? variant.line_total / variant.quantity : variant.unit_total;
                return {
                    ...variant,
                    unit_total: Math.round(unitTotal * 100) / 100, // Round to 2 decimal places
                };
            }),
        }));
    }, [cart.items]);

    // Calculate totals for grouped products
    const groupedProductsWithTotals = useMemo(() => {
        return groupedProducts.map((group) => {
            const totalQuantity = group.variants.reduce((sum, v) => sum + v.quantity, 0);
            const totalPrice = group.variants.reduce((sum, v) => sum + v.line_total, 0);
            const hasJobwork = group.variants.some(v => (v.configuration?.mode ?? 'purchase') === 'jobwork');
            const hasPurchase = group.variants.some(v => (v.configuration?.mode ?? 'purchase') === 'purchase');
            
            return {
                ...group,
                totalQuantity,
                totalPrice,
                hasJobwork,
                hasPurchase,
            };
        });
    }, [groupedProducts]);

    // Pagination calculations for grouped products
    const totalItems = groupedProductsWithTotals.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = useMemo(() => {
        return groupedProductsWithTotals.slice(startIndex, endIndex);
    }, [groupedProductsWithTotals, startIndex, endIndex]);

    const toggleProductExpansion = (productId: number) => {
        setExpandedProducts((prev) => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    };
    
    // Reset to page 1 when items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const { data: cartCommentData, setData: setCartCommentData, post: postCartComment } = useForm({
        comment: '',
    });

    // Initialize notes values
    useEffect(() => {
        const initialNotes: Record<number, string> = {};
        cart.items.forEach((item) => {
            initialNotes[item.id] = item.configuration?.notes ?? '';
        });
        setNotesValue(initialNotes);
    }, [cart.items]);

    const updateQuantity = (item: CartItem & { mergedItemIds?: number[] }, delta: number) => {
        // Ensure delta is exactly 1 or -1
        const normalizedDelta = delta > 0 ? 1 : -1;
        
        // Get the item ID to use for tracking updates
        const itemId = item.mergedItemIds && item.mergedItemIds.length > 1 
            ? item.mergedItemIds[0] 
            : item.id;
        
        // Prevent multiple simultaneous updates for the same item
        if (updatingQuantities.has(itemId)) {
            return;
        }
        
        // Get the current quantity - this is the displayed quantity which may be merged
        // For merged items, item.quantity is the sum of all merged items' quantities
        const currentDisplayQuantity = Number(item.quantity) || 0;
        const nextQuantity = Math.max(1, currentDisplayQuantity + normalizedDelta);
        
        // Check inventory limit (only when increasing, not when decreasing)
        const inventoryQuantity = item.inventory_quantity ?? null;
        if (inventoryQuantity !== null) {
            // If inventory is tracked and is 0, prevent all updates
            if (inventoryQuantity === 0) {
                return;
            }
            // Only prevent exceeding inventory when increasing (normalizedDelta > 0)
            // Allow decreasing even if quantity is above inventory (user needs to fix it)
            if (normalizedDelta > 0 && nextQuantity > inventoryQuantity) {
                return;
            }
        }
        
        // Mark this item as being updated
        setUpdatingQuantities((prev) => new Set(prev).add(itemId));
        
        const clearUpdating = () => {
            setUpdatingQuantities((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        };
        
        // If this is a merged variant (multiple cart items with same variant/config)
        if (item.mergedItemIds && item.mergedItemIds.length > 1) {
            // For merged items, we need to consolidate them into a single cart item
            // First, update the first item with the new total quantity
            router.patch(
                route('frontend.cart.items.update', item.mergedItemIds[0]),
                { quantity: nextQuantity },
                { 
                    preserveScroll: true, 
                    preserveState: true,
                    onSuccess: () => {
                        // After updating the first item, delete all other merged items
                        const itemsToDelete = item.mergedItemIds!.slice(1);
                        
                        if (itemsToDelete.length === 0) {
                            clearUpdating();
                            return;
                        }
                        
                        // Delete the remaining items sequentially
                        let completed = 0;
                        itemsToDelete.forEach((idToDelete) => {
                            router.delete(
                                route('frontend.cart.items.destroy', idToDelete),
                                {
                                    preserveScroll: true,
                                    preserveState: true,
                                    onFinish: () => {
                                        completed++;
                                        if (completed === itemsToDelete.length) {
                                            clearUpdating();
                                        }
                                    },
                                    onError: () => {
                                        completed++;
                                        if (completed === itemsToDelete.length) {
                                            clearUpdating();
                                        }
                                    },
                                },
                            );
                        });
                    },
                    onError: clearUpdating,
                },
            );
        } else {
            // Single item - simple update
            router.patch(
                route('frontend.cart.items.update', item.id),
                { quantity: nextQuantity },
                { 
                    preserveScroll: true, 
                    preserveState: true,
                    onFinish: clearUpdating,
                    onError: clearUpdating,
                },
            );
        }
    };

    const updateConfiguration = (item: CartItem, configuration: { notes?: string | null }) => {
        router.patch(
            route('frontend.cart.items.update', item.id),
            { configuration },
            { preserveScroll: true, preserveState: true },
        );
    };

    const removeItem = (item: CartItem) => {
        router.delete(route('frontend.cart.items.destroy', item.id), {
            preserveScroll: true,
        });
    };

    const openNotesModal = (item: CartItem) => {
        setNotesValue((prev) => ({
            ...prev,
            [item.id]: item.configuration?.notes ?? '',
        }));
        setNotesModalOpen(item.id);
    };

    const saveNotes = (item: CartItem) => {
        updateConfiguration(item, {
            notes: notesValue[item.id] || null,
        });
        setNotesModalOpen(null);
    };

    const isEmpty = cart.items.length === 0;

    const submitQuotations = () => {
        if (isEmpty) {
            return;
        }

        // Validate inventory before opening modal
        const variantQuantities: Record<number, { variant: CartItem['inventory_quantity'], product: string, total: number }> = {};
        const errors: string[] = [];

        cart.items.forEach((item) => {
            if (item.inventory_quantity !== null && item.inventory_quantity !== undefined && item.product_variant_id) {
                const variantId = item.product_variant_id;
                if (!variantQuantities[variantId]) {
                    variantQuantities[variantId] = {
                        variant: item.inventory_quantity,
                        product: item.name,
                        total: 0,
                    };
                }
                variantQuantities[variantId].total += item.quantity;
            }
        });

        // Check if any variant exceeds inventory
        Object.values(variantQuantities).forEach(({ variant, product, total }) => {
            if (variant === 0) {
                errors.push(`${product} is currently out of stock.`);
            } else if (variant !== null && variant !== undefined && total > variant) {
                errors.push(`Total quantity requested for ${product} is ${total}, but only ${variant} ${variant === 1 ? 'item is' : 'items are'} available.`);
            }
        });

        setInventoryErrors(errors);
        setConfirmOpen(true);
    };

    const confirmSubmit = () => {
        if (submitting || isEmpty) {
            return;
        }

        // Validate inventory before submitting
        const variantQuantities: Record<number, { variant: CartItem['inventory_quantity'], product: string, total: number }> = {};
        const inventoryErrors: string[] = [];

        cart.items.forEach((item) => {
            if (item.inventory_quantity !== null && item.inventory_quantity !== undefined && item.product_variant_id) {
                const variantId = item.product_variant_id;
                if (!variantQuantities[variantId]) {
                    variantQuantities[variantId] = {
                        variant: item.inventory_quantity,
                        product: item.name,
                        total: 0,
                    };
                }
                variantQuantities[variantId].total += item.quantity;
            }
        });

        // Check if any variant exceeds inventory
        Object.values(variantQuantities).forEach(({ variant, product, total }) => {
            if (variant === 0) {
                inventoryErrors.push(`${product} is currently out of stock.`);
            } else if (variant !== null && variant !== undefined && total > variant) {
                inventoryErrors.push(`Total quantity requested for ${product} is ${total}, but only ${variant} ${variant === 1 ? 'item is' : 'items are'} available.`);
            }
        });

        if (inventoryErrors.length > 0) {
            // Show error in modal and don't submit
            setInventoryErrors(inventoryErrors);
            return;
        }
        
        // Clear any previous errors
        setInventoryErrors([]);

        setSubmitting(true);
        router.post(
            route('frontend.quotations.store-from-cart'),
            { cart_comment: cartCommentData.comment || null },
            {
                preserveScroll: true,
                onSuccess: () => setConfirmOpen(false),
                onError: (errors) => {
                    // Handle backend validation errors
                    if (errors.quantity) {
                        alert(Array.isArray(errors.quantity) ? errors.quantity.join('\n') : errors.quantity);
                    }
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const selectedItem = notesModalOpen ? cart.items.find((item) => item.id === notesModalOpen) : null;

    return (
        <AuthenticatedLayout>
            <Head title="Quotation list" />

            <div className="space-y-10" id="cart">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Quotation list</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Review and submit all quotation requests together for merchandising review.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={submitQuotations}
                            disabled={isEmpty}
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                                isEmpty
                                    ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                    : 'bg-elvee-blue text-white shadow-lg shadow-elvee-blue/30 hover:bg-navy'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Submit all quotations
                        </button>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                            {isEmpty ? (
                                <div className="flex flex-col items-center justify-center space-y-4 p-16 text-sm text-slate-500">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        className="h-12 w-12 text-slate-300"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                    <p>Your cart is empty. Explore the catalogue to add designs.</p>
                                    <Link
                                        href={route('frontend.catalog.index')}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Browse catalogue
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    {/* Pagination Controls - Top */}
                                    {totalItems > itemsPerPage && (
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={totalItems}
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={setCurrentPage}
                                            onItemsPerPageChange={setItemsPerPage}
                                            startIndex={startIndex}
                                            endIndex={endIndex}
                                        />
                                    )}
                                    
                                <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead className="bg-slate-50">
                                            <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Product</th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">Mode</th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">Quantity</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-700">Unit Price</th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-700">Total</th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                            <tbody className="divide-y divide-slate-200 bg-white">
                                                {paginatedProducts.map((group) => {
                                                    const isExpanded = expandedProducts.has(group.product.product_id);
                                                    const variantCount = group.variants.length;
                                                    
                                                    return (
                                                        <React.Fragment key={group.product.product_id}>
                                                            {/* Product Row */}
                                                            <tr className="transition hover:bg-slate-50/50">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleProductExpansion(group.product.product_id)}
                                                                            className="flex-shrink-0 text-slate-400 transition hover:text-slate-600"
                                                                            aria-label={isExpanded ? 'Collapse variants' : 'Expand variants'}
                                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth={2}
                                                                                className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                                            >
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                                            </svg>
                                                                        </button>
                                                                        {group.product.thumbnail && (
                                                                            <img
                                                                                src={group.product.thumbnail}
                                                                                alt={group.product.name}
                                                                                className="h-16 w-16 flex-shrink-0 rounded-lg object-cover shadow-sm"
                                                                            />
                                                                        )}
                                                                        <div className="min-w-0 flex-1">
                                                                            <Link
                                                                                href={route('frontend.catalog.show', { product: group.product.product_id })}
                                                                                className="text-sm font-semibold text-slate-900 truncate hover:text-feather-gold transition"
                                                                            >
                                                                                {group.product.name}
                                                                            </Link>
                                                                            <p className="text-xs text-slate-400">SKU {group.product.sku}</p>
                                                                            {variantCount > 1 && (
                                                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                                                    {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                                    <div className="flex flex-wrap items-center justify-center gap-1">
                                                                        {group.hasPurchase && (
                                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                                                                </svg>
                                                                                Purchase
                                                                            </span>
                                                                        )}
                                                                        {group.hasJobwork && (
                                                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 00-3.586 3.586l4.655 5.653m8.048-8.048l-2.496 3.03a2.548 2.548 0 01-3.586-3.586l2.496-3.03" />
                                                                                </svg>
                                                                                Jobwork
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                                    <span className="text-sm font-semibold text-slate-900">{group.totalQuantity}</span>
                                                                </td>
                                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">
                                                                    {variantCount > 1 ? '—' : formatter.format(group.product.unit_total)}
                                                                </td>
                                                                <td className="whitespace-nowrap px-6 py-4 text-right">
                                                                    <p className="text-sm font-semibold text-slate-900">{formatter.format(group.totalPrice)}</p>
                                                                </td>
                                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setProductDetailsModalOpen(group.product)}
                                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-elvee-blue"
                                                                            aria-label="View product details"
                                                                            title="View product details"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            
                                                            {/* Variants Rows (Expandable) */}
                                                            {isExpanded && variantCount > 0 && (
                                                                <>
                                                                    {group.variants.map((variant) => (
                                                                        <tr key={variant.id} className="bg-slate-50/30 transition hover:bg-slate-50/50">
                                                                            <td className="px-6 py-3 pl-20">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="min-w-0 flex-1">
                                                                                        {variant.variant_label && (
                                                                                            <p className="text-xs font-medium text-slate-700">{variant.variant_label}</p>
                                                                                        )}
                                                                                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                                                            {variant.price_breakdown.metal && variant.price_breakdown.metal > 0 && (
                                                                                                <>
                                                                                                    <span>Metal {formatter.format(variant.price_breakdown.metal)}</span>
                                                                                                    <span>·</span>
                                                                                                </>
                                                                                            )}
                                                                                            {variant.price_breakdown.diamond && variant.price_breakdown.diamond > 0 && (
                                                                                                <>
                                                                                                    <span>Diamond {formatter.format(variant.price_breakdown.diamond)}</span>
                                                                                                    <span>·</span>
                                                                                                </>
                                                                                            )}
                                                                                            <span>Making {formatter.format(variant.price_breakdown.making ?? 0)}</span>
                                                                                        </div>
                                                                                        {(variant.line_discount ?? 0) > 0 && (
                                                                                            <p className="mt-1 text-xs font-semibold text-emerald-600">
                                                                                                Discount −{formatter.format(variant.line_discount ?? 0)}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="whitespace-nowrap px-6 py-3 text-center">
                                                                                <span
                                                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                                        (variant.configuration?.mode ?? 'purchase') === 'jobwork'
                                                                                            ? 'bg-blue-100 text-blue-700'
                                                                                            : 'bg-slate-100 text-slate-700'
                                                                                    }`}
                                                                                >
                                                                                    {(variant.configuration?.mode ?? 'purchase') === 'jobwork' ? 'Jobwork' : 'Purchase'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="whitespace-nowrap px-6 py-3">
                                                                                <div className="flex flex-col items-center justify-center gap-1">
                                                                                    <div className="flex items-center justify-center gap-2">
                                                                                        {(() => {
                                                                                            const itemId = variant.mergedItemIds && variant.mergedItemIds.length > 1 
                                                                                                ? variant.mergedItemIds[0] 
                                                                                                : variant.id;
                                                                                            const isUpdating = updatingQuantities.has(itemId);
                                                                                            const canDecrease = !isUpdating && variant.quantity > 1;
                                                                                            const canIncrease = !isUpdating && 
                                                                                                (variant.inventory_quantity === null || 
                                                                                                 variant.inventory_quantity === undefined || 
                                                                                                 (variant.inventory_quantity > 0 && variant.quantity < variant.inventory_quantity));
                                                                                            
                                                                                            return (
                                                                                                <>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => updateQuantity(variant, -1)}
                                                                                                        disabled={!canDecrease}
                                                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                                                        aria-label="Decrease quantity"
                                                                                                    >
                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                                                                                        </svg>
                                                                                                    </button>
                                                                                                    <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-900">{variant.quantity}</span>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => updateQuantity(variant, 1)}
                                                                                                        disabled={!canIncrease}
                                                                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                                                                        aria-label="Increase quantity"
                                                                                                    >
                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                                                                        </svg>
                                                                                                    </button>
                                                                                                </>
                                                                                            );
                                                                                        })()}
                                                                                    </div>
                                                                                    {variant.inventory_quantity !== null && variant.inventory_quantity !== undefined && variant.quantity > variant.inventory_quantity && (
                                                                                        <span className="text-xs text-rose-500">
                                                                                            Only {variant.inventory_quantity} {variant.inventory_quantity === 1 ? 'item is' : 'items are'} available
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="whitespace-nowrap px-6 py-3 text-right text-sm font-medium text-slate-900">
                                                                                {formatter.format(variant.unit_total)}
                                                                            </td>
                                                                            <td className="whitespace-nowrap px-6 py-3 text-right">
                                                                                <p className="text-sm font-semibold text-slate-900">{formatter.format(variant.line_total)}</p>
                                                                            </td>
                                                                            <td className="whitespace-nowrap px-6 py-3 text-center">
                                                                                <div className="flex items-center justify-center gap-2">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => openNotesModal(variant)}
                                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-feather-gold"
                                                                                        aria-label="Edit notes"
                                                                                        title={variant.configuration?.notes ? 'View/edit notes' : 'Add notes'}
                                                                                    >
                                                                                        {variant.configuration?.notes ? (
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                                                                            </svg>
                                                                                        ) : (
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                                            </svg>
                                                                                        )}
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeItem(variant)}
                                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                                                                        aria-label="Remove variant"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                    </table>
                                </div>
                                
                                {/* Pagination Controls - Bottom */}
                                {totalItems > itemsPerPage && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                        onItemsPerPageChange={setItemsPerPage}
                                        startIndex={startIndex}
                                        endIndex={endIndex}
                                    />
                                )}
                            </>
                            )}
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatter.format(cart.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tax</span>
                                    <span className="font-medium">{formatter.format(cart.tax)}</span>
                                </div>
                                {cart.discount > 0 && (
                                    <div className="flex items-center justify-between text-emerald-600">
                                        <span>Discount</span>
                                        <span className="font-medium">-{formatter.format(cart.discount)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium">{formatter.format(cart.shipping)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3">
                                    <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                                        <span>Total</span>
                                        <span>{formatter.format(cart.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Cart Notes</h2>
                            <p className="mt-1 text-xs text-slate-500">Add a comment for all items in this cart</p>
                            <textarea
                                value={cartCommentData.comment}
                                onChange={(e) => setCartCommentData('comment', e.target.value)}
                                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                placeholder="Add notes for the merchandising team..."
                                rows={4}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={submitQuotations}
                            disabled={isEmpty}
                            className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                                isEmpty
                                    ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                    : 'bg-elvee-blue text-white shadow-lg shadow-elvee-blue/30 hover:bg-navy'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Submit quotations
                        </button>
                    </aside>
                </div>
            </div>

            <Modal show={confirmOpen} onClose={() => (!submitting ? (setConfirmOpen(false), setInventoryErrors([])) : undefined)} maxWidth="lg">
                <div className="space-y-5 p-6">
                    <h2 className="text-lg font-semibold text-slate-900">Submit all quotation requests?</h2>
                    <p className="text-sm text-slate-600">
                        We will create separate quotation tickets for each product so the merchandising team can review the
                        details. You can still add more items afterwards.
                    </p>
                    {inventoryErrors.length > 0 && (
                        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
                            <div className="flex items-start gap-2">
                                <svg className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="font-semibold mb-2">Inventory Not Available</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {inventoryErrors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p>
                            <span className="font-semibold text-slate-800">Products selected:</span> {cart.items.length}
                        </p>
                        <p className="mt-1">
                            <span className="font-semibold text-slate-800">Total units:</span> {totalQuantity}
                        </p>
                        {jobworkCount > 0 && (
                            <p className="mt-1">
                                <span className="font-semibold text-slate-800">Jobwork requests:</span> {jobworkCount}
                            </p>
                        )}
                        <p className="mt-1">
                            <span className="font-semibold text-slate-800">Estimated total:</span> {formatter.format(cart.total)}
                        </p>
                        {cartCommentData.comment && (
                            <div className="mt-3 rounded-lg bg-white p-3">
                                <p className="text-xs font-semibold text-slate-700">Cart Notes:</p>
                                <p className="mt-1 text-xs text-slate-600">{cartCommentData.comment}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => (!submitting ? setConfirmOpen(false) : undefined)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmSubmit}
                            disabled={submitting || inventoryErrors.length > 0}
                            className="inline-flex items-center justify-center rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Submitting…' : 'Confirm & submit'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={notesModalOpen !== null} onClose={() => setNotesModalOpen(null)} maxWidth="md">
                {selectedItem && (
                    <div className="space-y-4 p-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Notes for {selectedItem.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">SKU {selectedItem.sku}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Notes</label>
                            <textarea
                                value={notesValue[selectedItem.id] || ''}
                                onChange={(e) =>
                                    setNotesValue((prev) => ({
                                        ...prev,
                                        [selectedItem.id]: e.target.value,
                                    }))
                                }
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                placeholder="Share expectations or deadlines..."
                                rows={5}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setNotesModalOpen(null)}
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => saveNotes(selectedItem)}
                                className="inline-flex items-center justify-center rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
                            >
                                Save notes
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Quick View Modal */}
            {productDetailsModalOpen && (
                <Modal show={true} onClose={() => setProductDetailsModalOpen(null)} maxWidth="lg">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-5 py-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-slate-900">Quick View</h3>
                                <button
                                    type="button"
                                    onClick={() => setProductDetailsModalOpen(null)}
                                    className="text-slate-400 transition hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                            <div className="space-y-4">
                                {/* Product Image and Basic Info - Compact */}
                                <div className="flex gap-4">
                                    {productDetailsModalOpen.thumbnail && (
                                        <img
                                            src={productDetailsModalOpen.thumbnail}
                                            alt={productDetailsModalOpen.name}
                                            className="h-24 w-24 flex-shrink-0 rounded-lg object-cover shadow-md"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-lg font-semibold text-slate-900">{productDetailsModalOpen.name}</h4>
                                        <p className="mt-0.5 text-xs text-slate-500">SKU: {productDetailsModalOpen.sku}</p>
                                        {productDetailsModalOpen.variant_label && (
                                            <p className="mt-1 text-xs font-medium text-slate-600">{productDetailsModalOpen.variant_label}</p>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    (productDetailsModalOpen.configuration?.mode ?? 'purchase') === 'jobwork'
                                                        ? 'bg-elvee-blue/10 text-elvee-blue'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {(productDetailsModalOpen.configuration?.mode ?? 'purchase') === 'jobwork' ? 'Jobwork' : 'Purchase'}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                                Qty: {productDetailsModalOpen.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Price Breakdown */}
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">Price Breakdown</h5>
                                    <div className="space-y-1.5 text-xs">
                                        {(() => {
                                            const priceBreakdown = productDetailsModalOpen.price_breakdown || {};
                                            const metalCost = Number(priceBreakdown.metal) || 0;
                                            const diamondCost = Number(priceBreakdown.diamond) || 0;
                                            const makingCharge = Number(priceBreakdown.making) || 0;
                                            const adjustment = Number(priceBreakdown.adjustment) || 0;
                                            const unitTotal = productDetailsModalOpen.unit_total;
                                            const lineTotal = productDetailsModalOpen.line_total;

                                            return (
                                                <>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                        {metalCost > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-600">Metal:</span>
                                                                <span className="font-semibold text-slate-900">{formatter.format(metalCost)}</span>
                                                            </div>
                                                        )}
                                                        {diamondCost > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-600">Diamond:</span>
                                                                <span className="font-semibold text-slate-900">{formatter.format(diamondCost)}</span>
                                                            </div>
                                                        )}
                                                        {makingCharge > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-600">Making:</span>
                                                                <span className="font-semibold text-slate-900">{formatter.format(makingCharge)}</span>
                                                            </div>
                                                        )}
                                                        {adjustment !== 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-600">Adjustment:</span>
                                                                <span className={`font-semibold ${adjustment > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                    {adjustment > 0 ? '+' : ''}{formatter.format(adjustment)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="border-t border-slate-300 pt-1.5 mt-1.5">
                                                        <div className="flex justify-between">
                                                            <span className="font-semibold text-slate-900">Unit Price:</span>
                                                            <span className="font-semibold text-slate-900">{formatter.format(unitTotal)}</span>
                                                        </div>
                                                        {productDetailsModalOpen.quantity > 1 && (
                                                            <div className="mt-0.5 flex justify-between text-xs text-slate-500">
                                                                <span>{productDetailsModalOpen.quantity} × {formatter.format(unitTotal)}</span>
                                                                <span className="font-semibold text-slate-700">= {formatter.format(lineTotal)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Compact Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Variant Info */}
                                    {productDetailsModalOpen.variant_label && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Variant</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{productDetailsModalOpen.variant_label}</p>
                                        </div>
                                    )}

                                    {/* Inventory Info */}
                                    {productDetailsModalOpen.inventory_quantity !== null && productDetailsModalOpen.inventory_quantity !== undefined && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</p>
                                            <p className={`mt-1 text-sm font-semibold ${productDetailsModalOpen.inventory_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {productDetailsModalOpen.inventory_quantity} {productDetailsModalOpen.inventory_quantity === 1 ? 'item' : 'items'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Options - Compact */}
                                {productDetailsModalOpen.configuration?.selections &&
                                    typeof productDetailsModalOpen.configuration.selections === 'object' &&
                                    productDetailsModalOpen.configuration.selections !== null &&
                                    Object.keys(productDetailsModalOpen.configuration.selections).length > 0 && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Options</p>
                                            <div className="space-y-1 text-xs">
                                                {Object.entries(productDetailsModalOpen.configuration.selections).slice(0, 3).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between">
                                                        <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                                                        <span className="font-medium text-slate-900">
                                                            {value === null || value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {Object.keys(productDetailsModalOpen.configuration.selections).length > 3 && (
                                                    <p className="text-xs text-slate-400 pt-1">
                                                        +{Object.keys(productDetailsModalOpen.configuration.selections).length - 3} more
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Notes - Compact */}
                                {productDetailsModalOpen.configuration?.notes && (
                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Notes</p>
                                        <p className="text-xs text-slate-700 line-clamp-3">{productDetailsModalOpen.configuration.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
