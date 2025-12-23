'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import { useCart } from '@/contexts/CartContext';

type PriceBreakdown = {
    metal?: number;
    diamond?: number;
    making?: number;
    subtotal?: number;
    discount?: number;
    total?: number;
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
        notes?: string | null;
    };
};

type CartData = {
    items: CartItem[];
    currency: string;
    subtotal: number;
    tax: number;
    discount: number;
    shipping: number;
    total: number;
};

const currencyFormatter = (currency: string) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    });

// Helper to get media URL
const getMediaUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function CartPage() {
    const router = useRouter();
    const { refreshCart } = useCart();
    const [cart, setCart] = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchCart = async () => {
        setLoading(true);
        setError(null);
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
                    thumbnail: getMediaUrl(item.thumbnail),
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
            setError('Failed to load cart. Please try again.');
            setCart({ items: [], currency: 'INR', subtotal: 0, tax: 0, discount: 0, shipping: 0, total: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const formatter = useMemo(() => currencyFormatter(cart?.currency || 'INR'), [cart?.currency]);
    const totalQuantity = useMemo(() => cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0, [cart?.items]);

    const groupedProducts = useMemo(() => {
        if (!cart?.items) return [];
        const grouped = new Map<number, { product: CartItem; variants: CartItem[] }>();
        cart.items.forEach((item) => {
            if (!grouped.has(item.product_id)) {
                grouped.set(item.product_id, { product: item, variants: [item] });
            } else {
                grouped.get(item.product_id)!.variants.push(item);
            }
        });
        return Array.from(grouped.values()).map(group => ({
            ...group,
            totalQuantity: group.variants.reduce((sum, v) => sum + v.quantity, 0),
            totalPrice: group.variants.reduce((sum, v) => sum + v.line_total, 0),
        }));
    }, [cart?.items]);

    const totalItems = groupedProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = groupedProducts.slice(startIndex, startIndex + itemsPerPage);

    const updateQuantity = async (item: CartItem, delta: number) => {
        const nextQuantity = Math.max(1, item.quantity + delta);
        
        // Check inventory limit (only when increasing)
        if (delta > 0 && item.inventory_quantity !== null && item.inventory_quantity !== undefined) {
            if (item.inventory_quantity === 0) {
                setFlashMessage({ type: 'error', message: 'This product variant is currently out of stock.' });
                setTimeout(() => setFlashMessage(null), 3000);
                return;
            }
            if (nextQuantity > item.inventory_quantity) {
                const itemWord = item.inventory_quantity === 1 ? 'item' : 'items';
                const isWord = item.inventory_quantity === 1 ? 'item is' : 'items are';
                setFlashMessage({ 
                    type: 'error', 
                    message: `Only ${item.inventory_quantity} ${isWord} available. Maximum ${item.inventory_quantity} ${itemWord} allowed.` 
                });
                setTimeout(() => setFlashMessage(null), 3000);
                return;
            }
        }

        setUpdatingQuantities(prev => new Set(prev).add(item.id));
        
        try {
            await frontendService.updateCartItem(item.id, nextQuantity);
            await fetchCart(); // Refresh cart to get updated prices
            await refreshCart(); // Update cart count in navbar
            setFlashMessage({ type: 'success', message: 'Updated quotation entry.' });
            setTimeout(() => setFlashMessage(null), 3000);
        } catch (err: any) {
            console.error('Failed to update quantity:', err);
            setFlashMessage({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to update quantity. Please try again.' 
            });
            setTimeout(() => setFlashMessage(null), 3000);
        } finally {
            setUpdatingQuantities(prev => { 
                const n = new Set(prev); 
                n.delete(item.id); 
                return n; 
            });
        }
    };

    const removeItem = async (item: CartItem) => {
        try {
            await frontendService.removeCartItem(item.id);
            await fetchCart(); // Refresh cart
            await refreshCart(); // Update cart count in navbar
            setFlashMessage({ type: 'success', message: 'Removed from your purchase list.' });
            setTimeout(() => setFlashMessage(null), 3000);
        } catch (err: any) {
            console.error('Failed to remove item:', err);
            setFlashMessage({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to remove item. Please try again.' 
            });
            setTimeout(() => setFlashMessage(null), 3000);
        }
    };

    const saveNotes = async (item: CartItem) => {
        try {
            await frontendService.updateCartItem(item.id, undefined, {
                notes: notesValue[item.id] || null,
            });
            await fetchCart(); // Refresh cart
            setNotesModalOpen(null);
            setFlashMessage({ type: 'success', message: 'Updated quotation entry.' });
            setTimeout(() => setFlashMessage(null), 3000);
        } catch (err: any) {
            console.error('Failed to save notes:', err);
            setFlashMessage({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to save notes. Please try again.' 
            });
            setTimeout(() => setFlashMessage(null), 3000);
        }
    };

    const submitQuotations = () => {
        if (!cart || cart.items.length === 0) {
            return;
        }

        // Validate inventory before opening modal
        const variantQuantities: Record<number, { variant: number | null; product: string; total: number }> = {};
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

    const confirmSubmit = async () => {
        if (submitting || !cart || cart.items.length === 0) {
            return;
        }

        // Validate inventory before submitting
        const variantQuantities: Record<number, { variant: number | null; product: string; total: number }> = {};
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
            setInventoryErrors(inventoryErrors);
            return;
        }
        
        setInventoryErrors([]);
        setSubmitting(true);

        try {
            await frontendService.submitQuotationsFromCart();
            await refreshCart(); // Update cart count in navbar (should be 0 after submission)
            setConfirmOpen(false);
            setFlashMessage({ type: 'success', message: 'Quotations submitted successfully.' });
            setTimeout(() => {
                router.push(route('frontend.quotations.index'));
            }, 1500);
        } catch (err: any) {
            console.error('Failed to submit quotations:', err);
            setFlashMessage({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to submit quotations. Please try again.' 
            });
            setTimeout(() => setFlashMessage(null), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !cart) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    const isEmpty = !cart?.items || cart.items.length === 0;

    return (
        <>
            {flashMessage && (
                <div
                    className={`mb-6 rounded-2xl border px-4 py-3 text-sm shadow-sm transition ${
                        flashMessage.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="font-medium">{flashMessage.message}</p>
                        <button
                            onClick={() => setFlashMessage(null)}
                            className="ml-4 text-current opacity-70 hover:opacity-100"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-4 w-4"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Quotation list</h1>
                        <p className="mt-2 text-sm text-slate-500">Review and submit all quotation requests together.</p>
                    </div>
                    <button 
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
                </header>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80 overflow-hidden">
                        {isEmpty ? (
                            <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-4">
                                <p>Your cart is empty.</p>
                                <Link href={route('frontend.catalog.index')} className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-semibold">Browse catalogue</Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Product</th>
                                            <th className="px-6 py-4 text-center">Qty</th>
                                            <th className="px-6 py-4 text-right">Unit</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                            <th className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {paginatedProducts.map((group) => (
                                            <React.Fragment key={group.product.product_id}>
                                                <tr className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 flex items-center gap-3">
                                                        <button 
                                                            onClick={() => setExpandedProducts(prev => { 
                                                                const n = new Set(prev); 
                                                                if (n.has(group.product.product_id)) n.delete(group.product.product_id); 
                                                                else n.add(group.product.product_id); 
                                                                return n; 
                                                            })} 
                                                            className={`transition-transform ${expandedProducts.has(group.product.product_id) ? 'rotate-90' : ''}`}
                                                        >
                                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path d="M9 5l7 7-7 7" strokeWidth={2} />
                                                            </svg>
                                                        </button>
                                                        {group.product.thumbnail && (
                                                            <img 
                                                                src={group.product.thumbnail} 
                                                                alt={group.product.name} 
                                                                className="h-12 w-12 rounded-lg object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">{group.product.name}</p>
                                                            <p className="text-xs text-slate-400">SKU {group.product.sku}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-semibold">{group.totalQuantity}</td>
                                                    <td className="px-6 py-4 text-right text-sm text-slate-500">
                                                        {group.variants.length > 1 ? '—' : formatter.format(group.product.unit_total)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold">{formatter.format(group.totalPrice)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button 
                                                            onClick={() => setProductDetailsModalOpen(group.product)} 
                                                            className="text-slate-500 hover:text-elvee-blue"
                                                        >
                                                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedProducts.has(group.product.product_id) && group.variants.map(v => (
                                                    <tr key={v.id} className="bg-slate-50/30">
                                                        <td className="px-6 py-3 pl-20 text-xs text-slate-500">{v.variant_label || 'Default Variant'}</td>
                                                        <td className="px-6 py-3 text-center flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => updateQuantity(v, -1)} 
                                                                disabled={v.quantity <= 1 || updatingQuantities.has(v.id)} 
                                                                className="h-6 w-6 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-4">{v.quantity}</span>
                                                            <button 
                                                                onClick={() => updateQuantity(v, 1)} 
                                                                disabled={updatingQuantities.has(v.id)} 
                                                                className="h-6 w-6 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                +
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-3 text-right text-sm">{formatter.format(v.unit_total)}</td>
                                                        <td className="px-6 py-3 text-right text-sm font-semibold">{formatter.format(v.line_total)}</td>
                                                        <td className="px-6 py-3 text-center flex gap-2 justify-center">
                                                            <button 
                                                                onClick={() => { 
                                                                    setNotesModalOpen(v.id); 
                                                                    setNotesValue(prev => ({ ...prev, [v.id]: v.configuration?.notes || '' })); 
                                                                }} 
                                                                className="text-slate-400 hover:text-feather-gold"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                onClick={() => removeItem(v)} 
                                                                className="text-slate-400 hover:text-rose-600"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {totalPages > 1 && (
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={totalPages} 
                                totalItems={totalItems} 
                                itemsPerPage={itemsPerPage} 
                                onPageChange={setCurrentPage} 
                                onItemsPerPageChange={setItemsPerPage} 
                                startIndex={startIndex} 
                                endIndex={startIndex + itemsPerPage} 
                            />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 space-y-3 text-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatter.format(cart?.subtotal || 0)}</span>
                            </div>
                            {cart && cart.discount > 0 && (
                                <div className="flex justify-between text-rose-600">
                                    <span>Discount</span>
                                    <span>-{formatter.format(cart.discount)}</span>
                                </div>
                            )}
                            {cart && cart.tax > 0 && (
                                <div className="flex justify-between">
                                    <span>Tax</span>
                                    <span>{formatter.format(cart.tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-3 font-semibold text-slate-900">
                                <span>Total</span>
                                <span>{formatter.format(cart?.total || 0)}</span>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Cart Notes</h2>
                            <textarea 
                                value={cartComment} 
                                onChange={e => setCartComment(e.target.value)} 
                                className="mt-3 w-full border rounded-xl p-3 text-sm" 
                                placeholder="Add notes for the merchandising team..." 
                                rows={4} 
                            />
                        </div>
                        <button 
                            onClick={submitQuotations} 
                            disabled={isEmpty} 
                            className="w-full bg-elvee-blue text-white py-3 rounded-full font-semibold shadow-lg shadow-elvee-blue/30 hover:bg-navy disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                        >
                            Submit quotations
                        </button>
                    </aside>
                </div>
            </div>

            <Modal show={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="lg">
                <div className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Submit all quotation requests?</h2>
                    {inventoryErrors.length > 0 && (
                        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
                            <p className="text-sm font-semibold text-rose-900 mb-2">Inventory Issues:</p>
                            <ul className="list-disc list-inside text-sm text-rose-700 space-y-1">
                                {inventoryErrors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <p className="text-sm text-slate-600">
                        We will create separate quotation tickets for each product. Final total: {formatter.format(cart?.total || 0)}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setConfirmOpen(false)} 
                            className="border px-4 py-2 rounded-full text-sm font-semibold"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmSubmit} 
                            disabled={submitting || inventoryErrors.length > 0} 
                            className="bg-elvee-blue text-white px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Confirm & submit'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={notesModalOpen !== null} onClose={() => setNotesModalOpen(null)} maxWidth="md">
                <div className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold">Notes</h2>
                    <textarea 
                        value={notesValue[notesModalOpen!] || ''} 
                        onChange={e => setNotesValue(p => ({ ...p, [notesModalOpen!]: e.target.value }))} 
                        className="w-full border rounded-xl p-3 text-sm" 
                        rows={5} 
                        placeholder="Share expectations..." 
                    />
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setNotesModalOpen(null)} 
                            className="px-4 py-2 text-sm font-semibold"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => saveNotes(cart!.items.find(i => i.id === notesModalOpen)!)}
                            className="bg-elvee-blue text-white px-5 py-2 rounded-full text-sm font-semibold"
                        >
                            Save notes
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
