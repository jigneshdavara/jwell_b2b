'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { route } from '@/utils/route';
import { getMediaUrlNullable } from '@/utils/mediaUrl';
import { frontendService } from '@/services/frontendService';
import { useAppDispatch } from '@/store/hooks';
import { fetchCart as fetchCartThunk } from '@/store/slices/cartSlice';
import { PaginationMeta } from '@/utils/pagination';
import type { CartItem, CartData } from '@/types';

const currencyFormatter = (currency: string) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    });

// Helper to get media URL

export default function CartPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const refreshCart = () => dispatch(fetchCartThunk());
    const [cart, setCart] = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notesModalOpen, setNotesModalOpen] = useState<number | null>(null);
    const [notesValue, setNotesValue] = useState<Record<number, string>>({});
    const [inventoryErrors, setInventoryErrors] = useState<string[]>([]);
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<CartItem | null>(null);
    const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
    const [updatingQuantities, setUpdatingQuantities] = useState<Set<number>>(new Set());
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [cartComment, setCartComment] = useState('');

    const loadCartData = async () => {
        setLoading(true);
        try {
            const response = await frontendService.getCart();
            if (response.data?.cart) {
                const cartData = response.data.cart;
                
                // Map items and convert BigInt to numbers
                const items: CartItem[] = (cartData.items || []).map((item: any) => ({
                    id: Number(item.id),
                    product_id: Number(item.product_id),
                    product_variant_id: item.product_variant_id ? Number(item.product_variant_id) : null,
                    sku: item.sku || '',
                    name: item.name || '',
                    quantity: Number(item.quantity) || 1,
                    inventory_quantity: item.inventory_quantity !== null && item.inventory_quantity !== undefined ? Number(item.inventory_quantity) : null,
                    unit_total: Number(item.unit_total) || 0,
                    line_total: Number(item.line_total) || 0,
                    line_subtotal: Number(item.line_subtotal) || Number(item.line_total) || 0,
                    line_discount: Number(item.line_discount) || 0,
                    price_breakdown: item.price_breakdown || {},
                    thumbnail: getMediaUrlNullable(item.thumbnail),
                    variant_label: item.variant_label || null,
                    configuration: item.configuration || {},
                }));

                const cartDataFormatted: CartData = {
                    items,
                    currency: cartData.currency || 'INR',
                    subtotal: Number(cartData.subtotal) || 0,
                    tax: Number(cartData.tax) || 0,
                    discount: Number(cartData.discount) || 0,
                    shipping: Number(cartData.shipping) || 0,
                    total: Number(cartData.total) || 0,
                };

                setCart(cartDataFormatted);
                
                // Initialize notes
                const initialNotes: Record<number, string> = {};
                items.forEach((item: CartItem) => {
                    initialNotes[item.id] = item.configuration?.notes || '';
                });
                setNotesValue(initialNotes);
            } else {
                setCart({ items: [], currency: 'INR', subtotal: 0, tax: 0, discount: 0, shipping: 0, total: 0 });
            }
        } catch (err: any) {
            console.error('Failed to fetch cart:', err);
            // Error toast handled by API interceptor
            setCart({ items: [], currency: 'INR', subtotal: 0, tax: 0, discount: 0, shipping: 0, total: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCartData();
    }, []);

    const formatter = useMemo(() => currencyFormatter(cart?.currency || 'INR'), [cart?.currency]);
    const totalQuantity = useMemo(() => cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0, [cart?.items]);

    // Group items by product, then merge identical variants
    const groupedProducts = useMemo(() => {
        if (!cart?.items) return [];
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
    }, [cart?.items]);

    // Calculate totals for grouped products
    const groupedProductsWithTotals = useMemo(() => {
        return groupedProducts.map((group) => {
            const totalQuantity = group.variants.reduce((sum, v) => sum + v.quantity, 0);
            const totalPrice = group.variants.reduce((sum, v) => sum + v.line_total, 0);
            
            return {
                ...group,
                totalQuantity,
                totalPrice,
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

    // Create pagination meta object
    const paginationMeta: PaginationMeta = useMemo(() => {
        const generateLinks = (current: number, last: number) => {
            const links: Array<{ label: string; url: string | null; active: boolean }> = [];
            
            // Previous link
            links.push({
                label: '« Previous',
                url: current > 1 ? `?page=${current - 1}` : null,
                active: false,
            });
            
            // Page number links
            for (let i = 1; i <= last; i++) {
                if (i === 1 || i === last || (i >= current - 2 && i <= current + 2)) {
                    links.push({
                        label: String(i),
                        url: i !== current ? `?page=${i}` : null,
                        active: i === current,
                    });
                } else if (i === current - 3 || i === current + 3) {
                    links.push({
                        label: '...',
                        url: null,
                        active: false,
                    });
                }
            }
            
            // Next link
            links.push({
                label: 'Next »',
                url: current < last ? `?page=${current + 1}` : null,
                active: false,
            });
            
            return links;
        };
        
        return {
            current_page: currentPage,
            last_page: totalPages,
            per_page: itemsPerPage,
            total: totalItems,
            from: startIndex + 1,
            to: Math.min(endIndex, totalItems),
            links: generateLinks(currentPage, totalPages),
        };
    }, [currentPage, totalPages, itemsPerPage, totalItems, startIndex, endIndex]);

    const updateQuantity = async (item: CartItem & { mergedItemIds?: number[] }, delta: number) => {
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
            try {
                await frontendService.updateCartItem(item.mergedItemIds[0], nextQuantity);
                
                // After updating the first item, delete all other merged items
                const itemsToDelete = item.mergedItemIds.slice(1);
                
                if (itemsToDelete.length > 0) {
                    // Delete the remaining items sequentially
                    for (const idToDelete of itemsToDelete) {
                        try {
                            await frontendService.removeCartItem(idToDelete);
                        } catch (err) {
                            console.error('Failed to remove merged item:', err);
                        }
                    }
                }
                
                await loadCartData(); // Refresh cart to get updated prices
                await refreshCart(); // Update cart count in navbar
                clearUpdating();
            } catch (err: any) {
                console.error('Failed to update quantity:', err);
                clearUpdating();
            }
        } else {
            // Single item - simple update
            try {
                await frontendService.updateCartItem(item.id, nextQuantity);
                await loadCartData(); // Refresh cart to get updated prices
                await refreshCart(); // Update cart count in navbar
                clearUpdating();
            } catch (err: any) {
                console.error('Failed to update quantity:', err);
                clearUpdating();
            }
        }
    };

    const removeItem = async (item: CartItem) => {
        try {
            await frontendService.removeCartItem(item.id);
            await loadCartData(); // Refresh cart
            await refreshCart(); // Update cart count in navbar
            // Toast handled by API interceptor if backend returns response.data.message
        } catch (err: any) {
            console.error('Failed to remove item:', err);
            // Error toast handled by API interceptor
        }
    };

    const saveNotes = async (item: CartItem) => {
        try {
            await frontendService.updateCartItem(item.id, undefined, {
                notes: notesValue[item.id] || null,
            });
            await loadCartData(); // Refresh cart
            setNotesModalOpen(null);
            // Toast handled by API interceptor if backend returns response.data.message
        } catch (err: any) {
            console.error('Failed to save notes:', err);
            // Error toast handled by API interceptor
        }
    };

    const submitQuotations = () => {
        if (!cart || cart.items.length === 0) {
            return;
        }

        // Validate inventory before opening modal (matching Laravel validation)
        const variantQuantities: Record<number, { variant: number | null; product: string; variantLabel?: string; total: number }> = {};
        const errors: string[] = [];

        cart.items.forEach((item) => {
            if (item.inventory_quantity !== null && item.inventory_quantity !== undefined && item.product_variant_id) {
                const variantId = item.product_variant_id;
                if (!variantQuantities[variantId]) {
                    variantQuantities[variantId] = {
                        variant: item.inventory_quantity,
                        product: item.name,
                        variantLabel: (item as any).variant_label || undefined,
                        total: 0,
                    };
                }
                variantQuantities[variantId].total += item.quantity;
            }
        });

        // Check if any variant exceeds inventory (matching Laravel error format exactly)
        Object.values(variantQuantities).forEach(({ variant, product, variantLabel, total }) => {
            if (variant === 0) {
                const variantText = variantLabel ? ` (${variantLabel})` : '';
                errors.push(`${product}${variantText} is currently out of stock. Quotation requests are not available.`);
            } else if (variant !== null && variant !== undefined && total > variant) {
                const variantText = variantLabel ? ` (${variantLabel})` : '';
                const itemWord = variant === 1 ? 'item is' : 'items are';
                errors.push(`Total quantity requested for ${product}${variantText} is ${total}, but only ${variant} ${itemWord} available.`);
            }
        });

        setInventoryErrors(errors);
        setConfirmOpen(true);
    };

    const confirmSubmit = async () => {
        if (submitting || !cart || cart.items.length === 0) {
            return;
        }

        // Validate inventory before submitting (same validation as before opening modal)
        const variantQuantities: Record<number, { variant: number | null; product: string; variantLabel?: string; total: number }> = {};
        const inventoryErrors: string[] = [];

        cart.items.forEach((item) => {
            if (item.inventory_quantity !== null && item.inventory_quantity !== undefined && item.product_variant_id) {
                const variantId = item.product_variant_id;
                if (!variantQuantities[variantId]) {
                    variantQuantities[variantId] = {
                        variant: item.inventory_quantity,
                        product: item.name,
                        variantLabel: (item as any).variant_label || undefined,
                        total: 0,
                    };
                }
                variantQuantities[variantId].total += item.quantity;
            }
        });

        // Check if any variant exceeds inventory (matching Laravel error format)
        Object.values(variantQuantities).forEach(({ variant, product, variantLabel, total }) => {
            if (variant === 0) {
                const variantText = variantLabel ? ` (${variantLabel})` : '';
                inventoryErrors.push(`${product}${variantText} is currently out of stock. Quotation requests are not available.`);
            } else if (variant !== null && variant !== undefined && total > variant) {
                const variantText = variantLabel ? ` (${variantLabel})` : '';
                const itemWord = variant === 1 ? 'item is' : 'items are';
                inventoryErrors.push(`Total quantity requested for ${product}${variantText} is ${total}, but only ${variant} ${itemWord} available.`);
            }
        });

        if (inventoryErrors.length > 0) {
            // Show error in modal and don't submit (matching Laravel behavior)
            setInventoryErrors(inventoryErrors);
            return;
        }
        
        // Clear any previous errors
        setInventoryErrors([]);
        setSubmitting(true);

        try {
            await frontendService.submitQuotationsFromCart(cartComment || null);
            await refreshCart(); // Update cart count in navbar (should be 0 after submission)
            setConfirmOpen(false);
            setCartComment(''); // Clear cart notes after submission
            // Redirect to quotations index (matching Laravel behavior)
            router.push(route('frontend.quotations.index'));
        } catch (err: any) {
            console.error('Failed to submit quotations:', err);
            // Handle backend validation errors (matching Laravel error handling)
            if (err.response?.data?.message) {
                // Backend returns error message in message field
                const errorMessage = err.response.data.message;
                // Check if it's an inventory error (contains "out of stock" or "available")
                if (errorMessage.includes('out of stock') || errorMessage.includes('available')) {
                    // Split multiple errors if they're space-separated (Laravel joins with space)
                    const errors = errorMessage.split(/(?<=\.)\s+/).filter((e: string) => e.trim());
                    setInventoryErrors(errors);
                    // Don't show toast for inventory errors - they're shown in modal
                } else {
                    // Other errors are handled by API interceptor
                    // No manual toast needed
                }
            } else if (err.response?.data?.quantity) {
                // Handle quantity validation errors (if backend returns in quantity field)
                const quantityErrors = Array.isArray(err.response.data.quantity) 
                    ? err.response.data.quantity 
                    : [err.response.data.quantity];
                setInventoryErrors(quantityErrors);
            }
            // Generic errors are handled by API interceptor
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !cart) {
        return (
            <div className="flex items-center justify-center py-12 sm:py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent sm:h-12 sm:w-12" />
            </div>
        );
    }

    const isEmpty = !cart?.items || cart.items.length === 0;

    return (
        <>
            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                <header className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 flex flex-col gap-3 sm:rounded-3xl sm:p-6 lg:flex-row lg:justify-between lg:items-center lg:gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl lg:text-3xl">Quotation list</h1>
                        <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">Review and submit all quotation requests together.</p>
                    </div>
                    <button 
                        onClick={submitQuotations} 
                        disabled={isEmpty} 
                        className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition sm:gap-2 sm:px-5 sm:py-2 sm:text-sm ${
                            isEmpty 
                                ? 'cursor-not-allowed bg-slate-300 text-slate-500' 
                                : 'bg-elvee-blue text-white shadow-lg shadow-elvee-blue/30 hover:bg-navy'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submit all quotations
                    </button>
                </header>

                <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="rounded-xl bg-white shadow-xl ring-1 ring-slate-200/80 overflow-hidden sm:rounded-2xl">
                        {isEmpty ? (
                            <div className="flex flex-col items-center justify-center space-y-3 p-8 text-xs text-slate-500 sm:space-y-4 sm:p-12 sm:text-sm lg:p-16">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    className="h-8 w-8 text-slate-300 sm:h-12 sm:w-12"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                <p className="text-center">Your cart is empty. Explore the catalogue to add designs.</p>
                                <Link
                                    href={route('frontend.catalog.index')}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Browse catalogue
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Pagination Controls - Top */}
                                {totalItems > itemsPerPage && (
                                    <div className="px-3 sm:px-4">
                                        <Pagination
                                            meta={paginationMeta}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                )}
                                
                                <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-xs sm:text-sm">
                                    <thead className="bg-slate-50 text-[10px] font-semibold uppercase text-slate-700 sm:text-xs">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left sm:px-6 sm:py-4">Product</th>
                                            <th className="px-2 py-2.5 text-center sm:px-6 sm:py-4">Qty</th>
                                            <th className="px-2 py-2.5 text-right sm:px-6 sm:py-4">Unit</th>
                                            <th className="px-2 py-2.5 text-right sm:px-6 sm:py-4">Total</th>
                                            <th className="px-2 py-2.5 text-center sm:px-6 sm:py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {paginatedProducts.map((group) => {
                                            const isExpanded = expandedProducts.has(group.product.product_id);
                                            const variantCount = group.variants.length;
                                            
                                            return (
                                                <React.Fragment key={group.product.product_id}>
                                                    {/* Product Row */}
                                                    <tr className="transition hover:bg-slate-50/50">
                                                        <td className="px-3 py-2.5 sm:px-6 sm:py-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setExpandedProducts((prev) => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(group.product.product_id)) {
                                                                                next.delete(group.product.product_id);
                                                                            } else {
                                                                                next.add(group.product.product_id);
                                                                            }
                                                                            return next;
                                                                        });
                                                                    }}
                                                                    className="flex-shrink-0 text-slate-400 transition hover:text-slate-600"
                                                                    aria-label={isExpanded ? 'Collapse variants' : 'Expand variants'}
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth={2}
                                                                        className={`h-4 w-4 transition-transform sm:h-5 sm:w-5 ${isExpanded ? 'rotate-90' : ''}`}
                                                                    >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </button>
                                                                {group.product.thumbnail && (
                                                                    <img
                                                                        src={group.product.thumbnail}
                                                                        alt={group.product.name}
                                                                        className="h-12 w-12 flex-shrink-0 rounded-lg object-cover shadow-sm sm:h-16 sm:w-16"
                                                                    />
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <Link
                                                                        href={route('frontend.catalog.show', { product: group.product.product_id })}
                                                                        className="text-xs font-semibold text-slate-900 truncate hover:text-feather-gold transition sm:text-sm"
                                                                    >
                                                                        {group.product.name}
                                                                    </Link>
                                                                    <p className="text-[10px] text-slate-400 sm:text-xs">SKU {group.product.sku}</p>
                                                                    {variantCount > 1 && (
                                                                        <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
                                                                            {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-2 py-2.5 text-center sm:px-6 sm:py-4">
                                                            <span className="text-xs font-semibold text-slate-900 sm:text-sm">{group.totalQuantity}</span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-2 py-2.5 text-right text-xs text-slate-500 sm:px-6 sm:py-4 sm:text-sm">
                                                            {variantCount > 1 ? '—' : formatter.format(group.product.unit_total)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-2 py-2.5 text-right sm:px-6 sm:py-4">
                                                            <p className="text-xs font-semibold text-slate-900 sm:text-sm">{formatter.format(group.totalPrice)}</p>
                                                        </td>
                                                        <td className="whitespace-nowrap px-2 py-2.5 text-center sm:px-6 sm:py-4">
                                                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setProductDetailsModalOpen(group.product)}
                                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-elvee-blue sm:h-8 sm:w-8"
                                                                    aria-label="View product details"
                                                                    title="View product details"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-4 sm:w-4">
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
                                                            {group.variants.map((v) => (
                                                    <tr key={v.id} className="bg-slate-50/30 transition hover:bg-slate-50/50">
                                                        <td className="px-3 py-2 pl-12 sm:px-6 sm:py-3 sm:pl-20">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="min-w-0 flex-1">
                                                                    {v.variant_label && (
                                                                        <p className="text-[10px] font-medium text-slate-700 sm:text-xs">{v.variant_label}</p>
                                                                    )}
                                                                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-slate-500 sm:mt-1 sm:gap-2 sm:text-xs">
                                                                        {v.price_breakdown.metal && v.price_breakdown.metal > 0 && (
                                                                            <>
                                                                                <span>Metal {formatter.format(v.price_breakdown.metal)}</span>
                                                                                <span>·</span>
                                                                            </>
                                                                        )}
                                                                        {v.price_breakdown.diamond && v.price_breakdown.diamond > 0 && (
                                                                            <>
                                                                                <span>Diamond {formatter.format(v.price_breakdown.diamond)}</span>
                                                                                <span>·</span>
                                                                            </>
                                                                        )}
                                                                        <span>Making {formatter.format(v.price_breakdown.making ?? 0)}</span>
                                                                    </div>
                                                                    {(v.line_discount ?? 0) > 0 && (
                                                                        <p className="mt-0.5 text-[10px] font-semibold text-emerald-600 sm:mt-1 sm:text-xs">
                                                                            Discount −{formatter.format(v.line_discount ?? 0)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-2 py-2 sm:px-6 sm:py-3">
                                                            <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                                                                <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateQuantity(v, -1)}
                                                                        disabled={v.quantity <= 1 || updatingQuantities.has(v.id)}
                                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-7 sm:w-7"
                                                                        aria-label="Decrease quantity"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-4 sm:w-4">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                                                        </svg>
                                                                    </button>
                                                                    <span className="min-w-[1.5rem] text-center text-xs font-semibold text-slate-900 sm:min-w-[2rem] sm:text-sm">{v.quantity}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateQuantity(v, 1)}
                                                                        disabled={updatingQuantities.has(v.id) || 
                                                                            (v.inventory_quantity !== null && 
                                                                             v.inventory_quantity !== undefined && 
                                                                             v.inventory_quantity > 0 && 
                                                                             v.quantity >= v.inventory_quantity)}
                                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-7 sm:w-7"
                                                                        aria-label="Increase quantity"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-4 sm:w-4">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                                {v.inventory_quantity !== null && v.inventory_quantity !== undefined && v.quantity > v.inventory_quantity && (
                                                                    <span className="text-[10px] text-rose-500 sm:text-xs">
                                                                        Only {v.inventory_quantity} {v.inventory_quantity === 1 ? 'item is' : 'items are'} available
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-900 sm:px-6 sm:py-3 sm:text-sm">
                                                            {formatter.format(v.unit_total)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-2 py-2 text-right sm:px-6 sm:py-3">
                                                            <p className="text-xs font-semibold text-slate-900 sm:text-sm">{formatter.format(v.line_total)}</p>
                                                        </td>
                                                        <td className="whitespace-nowrap px-2 py-2 text-center sm:px-6 sm:py-3">
                                                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNotesModalOpen(v.id);
                                                                        setNotesValue(prev => ({ ...prev, [v.id]: v.configuration?.notes || '' }));
                                                                    }}
                                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-feather-gold sm:h-8 sm:w-8"
                                                                    aria-label="Edit notes"
                                                                    title={v.configuration?.notes ? 'View/edit notes' : 'Add notes'}
                                                                >
                                                                    {v.configuration?.notes ? (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-4 sm:w-4">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-4 sm:w-4">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(v)}
                                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 sm:h-8 sm:w-8"
                                                                    aria-label="Remove variant"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-4 sm:w-4">
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
                                    <div className="px-3 sm:px-4">
                                        <Pagination
                                            meta={paginationMeta}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <aside className="space-y-3 sm:space-y-4">
                        <div className="rounded-xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80 sm:rounded-2xl sm:p-6">
                            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Summary</h2>
                            <div className="mt-3 space-y-2 text-xs text-slate-600 sm:mt-4 sm:space-y-3 sm:text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatter.format(cart?.subtotal || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tax</span>
                                    <span className="font-medium">{formatter.format(cart?.tax || 0)}</span>
                                </div>
                                {cart && cart.discount > 0 && (
                                    <div className="flex items-center justify-between text-emerald-600">
                                        <span>Discount</span>
                                        <span className="font-medium">-{formatter.format(cart.discount)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium">{formatter.format(cart?.shipping || 0)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-2 sm:pt-3">
                                    <div className="flex items-center justify-between text-sm font-semibold text-slate-900 sm:text-base">
                                        <span>Total</span>
                                        <span>{formatter.format(cart?.total || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80 sm:rounded-2xl sm:p-6">
                            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Cart Notes</h2>
                            <p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">Add a comment for all items in this cart</p>
                            <textarea
                                value={cartComment}
                                onChange={(e) => setCartComment(e.target.value)}
                                className="mt-2 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:mt-3 sm:rounded-xl sm:px-3 sm:text-sm"
                                placeholder="Add notes for the merchandising team..."
                                rows={3}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={submitQuotations}
                            disabled={isEmpty}
                            className={`w-full inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                                isEmpty
                                    ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                    : 'bg-elvee-blue text-white shadow-lg shadow-elvee-blue/30 hover:bg-navy'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 sm:h-4 sm:w-4">
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
                            <span className="font-semibold text-slate-800">Products selected:</span> {cart?.items.length || 0}
                        </p>
                        <p className="mt-1">
                            <span className="font-semibold text-slate-800">Total units:</span> {totalQuantity}
                        </p>
                        <p className="mt-1">
                            <span className="font-semibold text-slate-800">Estimated total:</span> {formatter.format(cart?.total || 0)}
                        </p>
                        {cartComment && (
                            <div className="mt-3 rounded-lg bg-white p-3">
                                <p className="text-xs font-semibold text-slate-700">Cart Notes:</p>
                                <p className="mt-1 text-xs text-slate-600">{cartComment}</p>
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
                {(() => {
                    const selectedItem = cart?.items.find((item) => item.id === notesModalOpen);
                    if (!selectedItem) return null;
                    
                    return (
                        <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">Notes for {selectedItem.name}</h3>
                                <p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">SKU {selectedItem.sku}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 sm:text-sm">Notes</label>
                                <textarea
                                    value={notesValue[selectedItem.id] || ''}
                                    onChange={(e) =>
                                        setNotesValue((prev) => ({
                                            ...prev,
                                            [selectedItem.id]: e.target.value,
                                        }))
                                    }
                                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:mt-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
                                    placeholder="Share expectations or deadlines..."
                                    rows={4}
                                />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => setNotesModalOpen(null)}
                                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => saveNotes(selectedItem)}
                                    className="inline-flex w-full items-center justify-center rounded-full bg-elvee-blue px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy sm:w-auto sm:px-5 sm:text-sm"
                                >
                                    Save notes
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Quick View Modal */}
            {productDetailsModalOpen && (
                <Modal show={true} onClose={() => setProductDetailsModalOpen(null)} maxWidth="lg">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-5 sm:py-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Quick View</h3>
                                <button
                                    type="button"
                                    onClick={() => setProductDetailsModalOpen(null)}
                                    className="text-slate-400 transition hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 sm:h-5 sm:w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
                            <div className="space-y-3 sm:space-y-4">
                                {/* Product Image and Basic Info - Compact */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    {productDetailsModalOpen.thumbnail && (
                                        <img
                                            src={productDetailsModalOpen.thumbnail}
                                            alt={productDetailsModalOpen.name}
                                            className="h-20 w-20 flex-shrink-0 rounded-lg object-cover shadow-md sm:h-24 sm:w-24"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">{productDetailsModalOpen.name}</h4>
                                        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">SKU: {productDetailsModalOpen.sku}</p>
                                        {productDetailsModalOpen.variant_label && (
                                            <p className="mt-1 text-[10px] font-medium text-slate-600 sm:text-xs">{productDetailsModalOpen.variant_label}</p>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 sm:text-xs">
                                                Qty: {productDetailsModalOpen.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Price Breakdown */}
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:rounded-xl sm:p-3">
                                    <h5 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 sm:mb-2 sm:text-xs">Price Breakdown</h5>
                                    <div className="space-y-1 text-[10px] sm:space-y-1.5 sm:text-xs">
                                        {(() => {
                                            const priceBreakdown = productDetailsModalOpen.price_breakdown || {};
                                            const metalCost = Number(priceBreakdown.metal) || 0;
                                            const diamondCost = Number(priceBreakdown.diamond) || 0;
                                            const makingCharge = Number(priceBreakdown.making) || 0;
                                            const unitTotal = productDetailsModalOpen.unit_total;
                                            const lineTotal = productDetailsModalOpen.line_total;

                                            return (
                                                <>
                                                    <div className="space-y-0.5 sm:space-y-1">
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
                                                    </div>
                                                    <div className="border-t border-slate-300 pt-1 mt-1 sm:pt-1.5 sm:mt-1.5">
                                                        <div className="flex justify-between">
                                                            <span className="font-semibold text-slate-900">Unit Price:</span>
                                                            <span className="font-semibold text-slate-900">{formatter.format(unitTotal)}</span>
                                                        </div>
                                                        {productDetailsModalOpen.quantity > 1 && (
                                                            <div className="mt-0.5 flex justify-between text-[10px] text-slate-500 sm:text-xs">
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
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    {/* Variant Info */}
                                    {productDetailsModalOpen.variant_label && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-2 sm:p-2.5">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide sm:text-xs">Variant</p>
                                            <p className="mt-1 text-xs font-semibold text-slate-900 sm:text-sm">{productDetailsModalOpen.variant_label}</p>
                                        </div>
                                    )}

                                    {/* Inventory Info */}
                                    {productDetailsModalOpen.inventory_quantity !== null && productDetailsModalOpen.inventory_quantity !== undefined && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-2 sm:p-2.5">
                                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide sm:text-xs">Stock</p>
                                            <p className={`mt-1 text-xs font-semibold sm:text-sm ${productDetailsModalOpen.inventory_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {productDetailsModalOpen.inventory_quantity} {productDetailsModalOpen.inventory_quantity === 1 ? 'item' : 'items'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Notes - Compact */}
                                {productDetailsModalOpen.configuration?.notes && (
                                    <div className="rounded-lg border border-slate-200 bg-white p-2 sm:p-2.5">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 sm:mb-1.5 sm:text-xs">Notes</p>
                                        <p className="text-[10px] text-slate-700 line-clamp-3 sm:text-xs">{productDetailsModalOpen.configuration.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
