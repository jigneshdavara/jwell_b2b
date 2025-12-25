'use client';

import React, { useState, useEffect, use } from 'react';
import { Head } from '@/components/Head';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

type RelatedQuotation = {
    id: string | number;
    status: string;
    quantity: number;
    notes?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt?: string }>;
    };
    variant?: {
        id: string | number;
        label: string;
        metadata?: Record<string, unknown> | null;
    } | null;
    price_breakdown?: {
        metal?: number;
        diamond?: number;
        making?: number;
        subtotal?: number;
        discount?: number;
        total?: number;
    };
};

type QuotationDetails = {
    id: string | number;
    status: string;
    quantity: number;
    notes?: string | null;
    admin_notes?: string | null;
    approved_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    related_quotations?: RelatedQuotation[];
    product: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt?: string }>;
    };
    variant?: {
        id: string | number;
        label: string;
        metadata?: Record<string, unknown> | null;
    } | null;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
    order?: {
        id: string | number;
        reference: string;
        status: string;
        total_amount: number;
        history?: Array<{
            id: number;
            status: string;
            created_at?: string | null;
        }>;
    } | null;
    price_breakdown?: {
        metal?: number;
        diamond?: number;
        making?: number;
        subtotal?: number;
        discount?: number;
        total?: number;
    };
    tax_rate?: number;
    tax_summary?: {
        subtotal: number;
        tax: number;
        total: number;
    };
    messages?: Array<{
        id: number;
        sender: 'customer' | 'admin';
        message: string;
        created_at?: string | null;
        author?: string | null;
    }>;
};

const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    pending_customer_confirmation: 'bg-amber-100 text-amber-700',
    customer_confirmed: 'bg-emerald-100 text-emerald-700',
    customer_declined: 'bg-rose-100 text-rose-700',
};

const formatDate = (input?: string | null) =>
    input
        ? new Date(input).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'N/A';

// Helper function to get media URL
const getMediaUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    // Remove double slashes
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`.replace(/(?<!:)\/{2,}/g, '/');
};

type ProductVariant = {
    id: number;
    label: string;
    metadata?: Record<string, unknown> | null;
    size_id?: number | null;
    size?: { id: number; name: string; value?: string } | null;
    metals?: Array<{
        id: number;
        metal_id: number;
        metal_purity_id: number | null;
        metal_tone_id: number | null;
        metal?: { id: number; name: string } | null;
        metal_purity?: { id: number; name: string } | null;
        metal_tone?: { id: number; name: string } | null;
    }>;
};

type SelectedProduct = {
    id: number;
    name: string;
    sku: string;
    variants: ProductVariant[];
};

type ConfigurationOption = {
    variant_id: number;
    metals: Array<{
        metalId: number;
        metalPurityId: number | null;
        metalToneId: number | null;
        metalName: string;
        purityName: string;
        toneName: string;
    }>;
    size: { id: number; name: string; value: string } | null;
    metadata: Record<string, unknown>;
};

export default function AdminQuotationShow({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<RelatedQuotation | null>(null);
    const [removeItemConfirm, setRemoveItemConfirm] = useState<{ show: boolean; itemId: string | number | null }>({
        show: false,
        itemId: null,
    });
    const [removeItemProcessing, setRemoveItemProcessing] = useState(false);
    
    // Actions state
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_confirmation' | ''>('');
    const [actionNotes, setActionNotes] = useState('');
    const [actionProcessing, setActionProcessing] = useState(false);
    
    // Messages state
    const [messageText, setMessageText] = useState('');
    const [messageProcessing, setMessageProcessing] = useState(false);

    // Change Product Modal state
    const [changeProductModalOpen, setChangeProductModalOpen] = useState<RelatedQuotation | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; sku: string }>>([]);
    const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
    const [isManualSearch, setIsManualSearch] = useState(false);
    const [changeProductMetalId, setChangeProductMetalId] = useState<number | ''>('');
    const [changeProductPurityId, setChangeProductPurityId] = useState<number | ''>('');
    const [changeProductToneId, setChangeProductToneId] = useState<number | ''>('');
    const [changeProductSize, setChangeProductSize] = useState('');
    const [changeProductQuantity, setChangeProductQuantity] = useState(1);
    const [changeProductNotes, setChangeProductNotes] = useState('');
    const [changeProductVariantId, setChangeProductVariantId] = useState<number | ''>('');
    const [changeProductProcessing, setChangeProductProcessing] = useState(false);

    // Add Item Modal state
    const [addItemModalOpen, setAddItemModalOpen] = useState(false);
    const [addItemProductSearch, setAddItemProductSearch] = useState('');
    const [addItemSearchResults, setAddItemSearchResults] = useState<Array<{ id: number; name: string; sku: string }>>([]);
    const [addItemSelectedProduct, setAddItemSelectedProduct] = useState<SelectedProduct | null>(null);
    const [isManualAddItemSearch, setIsManualAddItemSearch] = useState(false);
    const [addItemMetalId, setAddItemMetalId] = useState<number | ''>('');
    const [addItemPurityId, setAddItemPurityId] = useState<number | ''>('');
    const [addItemToneId, setAddItemToneId] = useState<number | ''>('');
    const [addItemSize, setAddItemSize] = useState('');
    const [addItemQuantity, setAddItemQuantity] = useState(1);
    const [addItemNotes, setAddItemNotes] = useState('');
    const [addItemVariantId, setAddItemVariantId] = useState<number | ''>('');
    const [addItemProcessing, setAddItemProcessing] = useState(false);

    useEffect(() => {
        loadQuotation();
    }, [resolvedParams.id]);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            const response = await adminService.getQuotation(Number(resolvedParams.id));
            if (response.data) {
                setQuotation(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load quotation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Combine main quotation with related quotations for display
    const allQuotations = React.useMemo(() => {
        if (!quotation) return [];
        const main: RelatedQuotation = {
            id: quotation.id,
            status: quotation.status,
            quantity: quotation.quantity,
            notes: quotation.notes,
            product: quotation.product,
            variant: quotation.variant,
            price_breakdown: quotation.price_breakdown,
        };
        return [main, ...(quotation.related_quotations || [])];
    }, [quotation]);

    const handleRemoveItem = async () => {
        if (!removeItemConfirm.itemId) return;
        try {
            setRemoveItemProcessing(true);
            await adminService.deleteQuotation(Number(removeItemConfirm.itemId));
            setRemoveItemConfirm({ show: false, itemId: null });
            // Reload quotation to get updated data
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to remove item:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to remove item';
            alert(errorMessage);
            // Keep modal open if there's an error so user can retry
        } finally {
            setRemoveItemProcessing(false);
        }
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionType) return;
        
        try {
            setActionProcessing(true);
            if (actionType === 'approve') {
                await adminService.approveQuotation(Number(resolvedParams.id), actionNotes || undefined);
            } else if (actionType === 'reject') {
                await adminService.rejectQuotation(Number(resolvedParams.id), actionNotes || undefined);
            } else if (actionType === 'request_confirmation') {
                await adminService.requestQuotationConfirmation(Number(resolvedParams.id), {
                    notes: actionNotes || undefined,
                });
            }
            setActionType('');
            setActionNotes('');
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to perform action:', error);
            alert(error.response?.data?.message || 'Failed to perform action');
        } finally {
            setActionProcessing(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        
        try {
            setMessageProcessing(true);
            await adminService.sendQuotationMessage(Number(resolvedParams.id), messageText);
            setMessageText('');
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to send message:', error);
            alert(error.response?.data?.message || 'Failed to send message');
        } finally {
            setMessageProcessing(false);
        }
    };

    // Product search for Change Product modal
    useEffect(() => {
        if (!changeProductModalOpen || !isManualSearch || productSearch.length < 2) {
            if (!isManualSearch) {
                setSearchResults([]);
            }
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const response = await adminService.getProducts({ search: productSearch, per_page: 10 });
                if (response.data?.items) {
                    setSearchResults(response.data.items.map((p: any) => ({ id: Number(p.id), name: p.name, sku: p.sku })));
                }
            } catch (error) {
                console.error('Failed to search products:', error);
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [productSearch, changeProductModalOpen, isManualSearch]);

    // Product search for Add Item modal
    useEffect(() => {
        if (!addItemModalOpen || !isManualAddItemSearch || addItemProductSearch.length < 2) {
            if (!isManualAddItemSearch) {
                setAddItemSearchResults([]);
            }
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const response = await adminService.getProducts({ search: addItemProductSearch, per_page: 10 });
                if (response.data?.items) {
                    setAddItemSearchResults(response.data.items.map((p: any) => ({ id: Number(p.id), name: p.name, sku: p.sku })));
                }
            } catch (error) {
                console.error('Failed to search products:', error);
                setAddItemSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [addItemProductSearch, addItemModalOpen, isManualAddItemSearch]);

    // Build configuration options for Change Product modal
    const changeProductConfigurationOptions = React.useMemo((): ConfigurationOption[] => {
        if (!selectedProduct || !selectedProduct.variants || selectedProduct.variants.length === 0) {
            return [];
        }

        return selectedProduct.variants.map((variant) => {
            const metals = (variant.metals || []).map((metal) => ({
                metalId: metal.metal_id,
                metalPurityId: metal.metal_purity_id,
                metalToneId: metal.metal_tone_id,
                metalName: metal.metal?.name || 'Metal',
                purityName: metal.metal_purity?.name || 'Purity',
                toneName: metal.metal_tone?.name || 'Tone',
            }));

            return {
                variant_id: variant.id,
                metals,
                size: variant.size ? {
                    id: variant.size.id,
                    name: variant.size.name,
                    value: variant.size.value || variant.size.name,
                } : null,
                metadata: variant.metadata || {},
            };
        });
    }, [selectedProduct]);

    // Build configuration options for Add Item modal
    const addItemConfigurationOptions = React.useMemo((): ConfigurationOption[] => {
        if (!addItemSelectedProduct || !addItemSelectedProduct.variants || addItemSelectedProduct.variants.length === 0) {
            return [];
        }

        return addItemSelectedProduct.variants.map((variant) => {
            const metals = (variant.metals || []).map((metal) => ({
                metalId: metal.metal_id,
                metalPurityId: metal.metal_purity_id,
                metalToneId: metal.metal_tone_id,
                metalName: metal.metal?.name || 'Metal',
                purityName: metal.metal_purity?.name || 'Purity',
                toneName: metal.metal_tone?.name || 'Tone',
            }));

            return {
                variant_id: variant.id,
                metals,
                size: variant.size ? {
                    id: variant.size.id,
                    name: variant.size.name,
                    value: variant.size.value || variant.size.name,
                } : null,
                metadata: variant.metadata || {},
            };
        });
    }, [addItemSelectedProduct]);

    // Available options for Change Product modal
    const changeProductAvailableMetals = React.useMemo(() => {
        const map = new Map<number, string>();
        changeProductConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (!map.has(m.metalId)) {
                    map.set(m.metalId, m.metalName);
                }
            })
        );
        return [...map.entries()];
    }, [changeProductConfigurationOptions]);

    const changeProductAvailablePurities = React.useMemo(() => {
        if (!changeProductMetalId) return [];
        const map = new Map<number, string>();
        changeProductConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === changeProductMetalId && m.metalPurityId) {
                    map.set(m.metalPurityId, m.purityName);
                }
            })
        );
        return [...map.entries()];
    }, [changeProductMetalId, changeProductConfigurationOptions]);

    const changeProductAvailableTones = React.useMemo(() => {
        if (!changeProductMetalId || !changeProductPurityId) return [];
        const map = new Map<number, string>();
        changeProductConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === changeProductMetalId && m.metalPurityId === changeProductPurityId && m.metalToneId) {
                    map.set(m.metalToneId, m.toneName);
                }
            })
        );
        return [...map.entries()];
    }, [changeProductMetalId, changeProductPurityId, changeProductConfigurationOptions]);

    const changeProductAvailableSizes = React.useMemo(() => {
        if (!changeProductMetalId || !changeProductPurityId || !changeProductToneId) return [];
        const sizes = new Set<string>();
        changeProductConfigurationOptions.forEach((c) => {
            const match = c.metals.some(
                (m) =>
                    m.metalId === changeProductMetalId &&
                    m.metalPurityId === changeProductPurityId &&
                    m.metalToneId === changeProductToneId
            );
            if (!match) return;
            if (c.size?.value || c.size?.name) {
                sizes.add(c.size.value || c.size.name);
            }
        });
        return [...sizes];
    }, [changeProductMetalId, changeProductPurityId, changeProductToneId, changeProductConfigurationOptions]);

    // Available options for Add Item modal
    const addItemAvailableMetals = React.useMemo(() => {
        const map = new Map<number, string>();
        addItemConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (!map.has(m.metalId)) {
                    map.set(m.metalId, m.metalName);
                }
            })
        );
        return [...map.entries()];
    }, [addItemConfigurationOptions]);

    const addItemAvailablePurities = React.useMemo(() => {
        if (!addItemMetalId) return [];
        const map = new Map<number, string>();
        addItemConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === addItemMetalId && m.metalPurityId) {
                    map.set(m.metalPurityId, m.purityName);
                }
            })
        );
        return [...map.entries()];
    }, [addItemMetalId, addItemConfigurationOptions]);

    const addItemAvailableTones = React.useMemo(() => {
        if (!addItemMetalId || !addItemPurityId) return [];
        const map = new Map<number, string>();
        addItemConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === addItemMetalId && m.metalPurityId === addItemPurityId && m.metalToneId) {
                    map.set(m.metalToneId, m.toneName);
                }
            })
        );
        return [...map.entries()];
    }, [addItemMetalId, addItemPurityId, addItemConfigurationOptions]);

    const addItemAvailableSizes = React.useMemo(() => {
        if (!addItemMetalId || !addItemPurityId || !addItemToneId) return [];
        const sizes = new Set<string>();
        addItemConfigurationOptions.forEach((c) => {
            const match = c.metals.some(
                (m) =>
                    m.metalId === addItemMetalId &&
                    m.metalPurityId === addItemPurityId &&
                    m.metalToneId === addItemToneId
            );
            if (!match) return;
            if (c.size?.value || c.size?.name) {
                sizes.add(c.size.value || c.size.name);
            }
        });
        return [...sizes];
    }, [addItemMetalId, addItemPurityId, addItemToneId, addItemConfigurationOptions]);

    // Auto-match variant for Change Product modal
    useEffect(() => {
        if (!changeProductMetalId || !changeProductPurityId || !changeProductToneId) {
            setChangeProductVariantId('');
            return;
        }
        if (changeProductAvailableSizes.length > 0 && !changeProductSize) {
            setChangeProductVariantId('');
            return;
        }

        const match = changeProductConfigurationOptions.find((c) => {
            const metalMatch = c.metals.some(
                (m) =>
                    m.metalId === changeProductMetalId &&
                    m.metalPurityId === changeProductPurityId &&
                    m.metalToneId === changeProductToneId
            );
            if (!metalMatch) return false;
            if (changeProductAvailableSizes.length === 0) return true;
            const s = c.size?.value || c.size?.name || '';
            return s === changeProductSize;
        });

        if (match) {
            setChangeProductVariantId(match.variant_id);
        } else {
            setChangeProductVariantId('');
        }
    }, [changeProductMetalId, changeProductPurityId, changeProductToneId, changeProductSize, changeProductAvailableSizes.length, changeProductConfigurationOptions]);

    // Auto-match variant for Add Item modal
    useEffect(() => {
        if (!addItemMetalId || !addItemPurityId || !addItemToneId) {
            setAddItemVariantId('');
            return;
        }
        if (addItemAvailableSizes.length > 0 && !addItemSize) {
            setAddItemVariantId('');
            return;
        }

        const match = addItemConfigurationOptions.find((c) => {
            const metalMatch = c.metals.some(
                (m) =>
                    m.metalId === addItemMetalId &&
                    m.metalPurityId === addItemPurityId &&
                    m.metalToneId === addItemToneId
            );
            if (!metalMatch) return false;
            if (addItemAvailableSizes.length === 0) return true;
            const s = c.size?.value || c.size?.name || '';
            return s === addItemSize;
        });

        if (match) {
            setAddItemVariantId(match.variant_id);
        } else {
            setAddItemVariantId('');
        }
    }, [addItemMetalId, addItemPurityId, addItemToneId, addItemSize, addItemAvailableSizes.length, addItemConfigurationOptions]);

    // Open Change Product Modal
    const openChangeModal = (item: RelatedQuotation) => {
        setChangeProductModalOpen(item);
        setIsManualSearch(false);
        setProductSearch(item.product.name);
        setChangeProductQuantity(item.quantity);
        setChangeProductNotes('');
        setChangeProductVariantId(item.variant?.id ? Number(item.variant.id) : '');
        
        // Initialize customization from current variant
        if (item.variant) {
            // We need to fetch product with variants to get full customization data
            fetchProductWithVariants(item.product.id, (product) => {
                setSelectedProduct(product);
                // Try to find and set current customization
                const currentVariant = product.variants.find(v => v.id === Number(item.variant?.id));
                if (currentVariant?.metals && currentVariant.metals.length > 0) {
                    const firstMetal = currentVariant.metals[0];
                    setChangeProductMetalId(firstMetal.metal_id);
                    setChangeProductPurityId(firstMetal.metal_purity_id ?? '');
                    setChangeProductToneId(firstMetal.metal_tone_id ?? '');
                    if (currentVariant.size) {
                        setChangeProductSize(currentVariant.size.value || currentVariant.size.name);
                    } else {
                        setChangeProductSize('');
                    }
                }
            });
        } else {
            fetchProductWithVariants(item.product.id, setSelectedProduct);
            setChangeProductMetalId('');
            setChangeProductPurityId('');
            setChangeProductToneId('');
            setChangeProductSize('');
        }
        setSearchResults([]);
    };

    const closeChangeModal = () => {
        setChangeProductModalOpen(null);
        setProductSearch('');
        setSearchResults([]);
        setSelectedProduct(null);
        setIsManualSearch(false);
        setChangeProductMetalId('');
        setChangeProductPurityId('');
        setChangeProductToneId('');
        setChangeProductSize('');
        setChangeProductQuantity(1);
        setChangeProductNotes('');
    };

    // Fetch product with variants
    const fetchProductWithVariants = async (productId: number, callback: (product: SelectedProduct) => void) => {
        try {
            const response = await adminService.getProduct(productId);
            if (response.data) {
                const product = response.data;
                callback({
                    id: Number(product.id),
                    name: product.name,
                    sku: product.sku,
                    variants: (product.variants || []).map((v: any) => ({
                        id: Number(v.id),
                        label: v.label,
                        metadata: v.metadata || {},
                        size_id: v.size_id ? Number(v.size_id) : null,
                        size: v.size ? {
                            id: Number(v.size.id),
                            name: v.size.name,
                            value: v.size.value || v.size.name,
                        } : null,
                        metals: (v.metals || []).map((m: any) => ({
                            id: Number(m.id),
                            metal_id: Number(m.metal_id),
                            metal_purity_id: m.metal_purity_id ? Number(m.metal_purity_id) : null,
                            metal_tone_id: m.metal_tone_id ? Number(m.metal_tone_id) : null,
                            metal: m.metal ? { id: Number(m.metal.id), name: m.metal.name } : null,
                            metal_purity: m.metal_purity ? { id: Number(m.metal_purity.id), name: m.metal_purity.name } : null,
                            metal_tone: m.metal_tone ? { id: Number(m.metal_tone.id), name: m.metal_tone.name } : null,
                        })),
                    })),
                });
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
        }
    };

    const selectProduct = (product: { id: number; name: string; sku: string }) => {
        setProductSearch(product.name);
        setSearchResults([]);
        fetchProductWithVariants(product.id, (productData) => {
            setSelectedProduct(productData);
            setChangeProductVariantId('');
            setChangeProductMetalId('');
            setChangeProductPurityId('');
            setChangeProductToneId('');
            setChangeProductSize('');
        });
    };

    const handleChangeProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!changeProductModalOpen || !selectedProduct || !changeProductVariantId) {
            alert('Please select a product and complete customization');
            return;
        }

        try {
            setChangeProductProcessing(true);
            await adminService.updateQuotationProduct(Number(changeProductModalOpen.id), {
                product_id: selectedProduct.id,
                product_variant_id: Number(changeProductVariantId),
                quantity: changeProductQuantity,
                admin_notes: changeProductNotes || undefined,
            });
            closeChangeModal();
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to update product:', error);
            alert(error.response?.data?.message || 'Failed to update product');
        } finally {
            setChangeProductProcessing(false);
        }
    };

    // Add Item Modal handlers
    const openAddItemModal = () => {
        setAddItemModalOpen(true);
        setIsManualAddItemSearch(false);
        setAddItemProductSearch('');
        setAddItemSearchResults([]);
        setAddItemSelectedProduct(null);
        setAddItemMetalId('');
        setAddItemPurityId('');
        setAddItemToneId('');
        setAddItemSize('');
        setAddItemQuantity(1);
        setAddItemNotes('');
        setAddItemVariantId('');
    };

    const closeAddItemModal = () => {
        setAddItemModalOpen(false);
        setAddItemProductSearch('');
        setAddItemSearchResults([]);
        setAddItemSelectedProduct(null);
        setIsManualAddItemSearch(false);
        setAddItemMetalId('');
        setAddItemPurityId('');
        setAddItemToneId('');
        setAddItemSize('');
        setAddItemQuantity(1);
        setAddItemNotes('');
        setAddItemVariantId('');
    };

    const selectAddItemProduct = (product: { id: number; name: string; sku: string }) => {
        setAddItemProductSearch(product.name);
        setAddItemSearchResults([]);
        fetchProductWithVariants(product.id, (productData) => {
            setAddItemSelectedProduct(productData);
            setAddItemVariantId('');
            setAddItemMetalId('');
            setAddItemPurityId('');
            setAddItemToneId('');
            setAddItemSize('');
        });
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addItemSelectedProduct || !addItemVariantId) {
            alert('Please select a product and complete customization');
            return;
        }

        try {
            setAddItemProcessing(true);
            await adminService.addQuotationItem(Number(resolvedParams.id), {
                product_id: addItemSelectedProduct.id,
                product_variant_id: Number(addItemVariantId),
                quantity: addItemQuantity,
                admin_notes: addItemNotes || undefined,
            });
            closeAddItemModal();
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to add item:', error);
            alert(error.response?.data?.message || 'Failed to add item');
        } finally {
            setAddItemProcessing(false);
        }
    };

    if (loading) {
        return (
            <>
                <Head title={`Quotation #${resolvedParams.id}`} />
                <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                </div>
            </>
        );
    }

    if (!quotation) {
        return (
            <>
                <Head title={`Quotation #${resolvedParams.id}`} />
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <p className="text-slate-600">Quotation not found.</p>
                    <Link href="/admin/quotations" className="mt-4 inline-block text-sm font-semibold text-elvee-blue hover:text-elvee-blue/80">
                        Back to list
                    </Link>
                </div>
            </>
        );
    }

    // Calculate totals for tax summary
    const taxSummary = quotation.tax_summary;
    const taxRate = quotation.tax_rate ?? 18;

    return (
        <>
            <Head title={`Quotation #${resolvedParams.id}`} />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-slate-900">Quotation #{resolvedParams.id}</h1>
                        <Link
                            href="/admin/quotations"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="grid gap-8 md:grid-cols-3">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">From</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">Elvee</p>
                                <p className="mt-1 text-sm text-slate-600">123 Business Street</p>
                                <p className="text-sm text-slate-600">Mumbai, Maharashtra 400001</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bill To</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">{quotation.user?.name ?? 'Unknown'}</p>
                                <p className="mt-1 text-sm text-slate-600">{quotation.user?.email ?? '—'}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Quotation Details</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">#{resolvedParams.id}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Date: <span className="font-semibold text-slate-900">{quotation.created_at && formatDate(quotation.created_at)}</span>
                                </p>
                                <div className="mt-3 flex justify-end gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                            statusBadge[quotation.status] ?? 'bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {quotation.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table - Invoice Style */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                            <button
                                type="button"
                                onClick={openAddItemModal}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Item</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Unit Price</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Qty</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Total</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allQuotations.map((item) => {
                                        const priceBreakdown = item.price_breakdown || {};
                                        const metalCost = Number(priceBreakdown.metal) || 0;
                                        const diamondCost = Number(priceBreakdown.diamond) || 0;
                                        const makingCharge = Number(priceBreakdown.making) || 0;
                                        const unitPrice = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                        const lineTotal = unitPrice * (Number(item.quantity) || 0);
                                        const variantLabel = item.variant?.metadata?.auto_label as string || item.variant?.label || '';
                                        
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {item.product.media?.[0] && (
                                                            <img
                                                                src={getMediaUrl(item.product.media[0].url)}
                                                                alt={item.product.media[0].alt || item.product.name}
                                                                className="h-12 w-12 rounded-lg object-cover shadow-sm"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                                                            <p className="text-xs text-slate-400">SKU {item.product.sku}</p>
                                                            {variantLabel && (
                                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                                    {variantLabel}
                                                                </p>
                                                            )}
                                                            {item.notes && (
                                                                <p className="mt-1 text-xs text-slate-500 italic">Note: {item.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="text-sm font-semibold text-slate-900">₹ {unitPrice.toLocaleString('en-IN')}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {metalCost > 0 && `Metal: ₹ ${metalCost.toLocaleString('en-IN')}`}
                                                        {metalCost > 0 && (diamondCost > 0 || makingCharge > 0) && ' + '}
                                                        {diamondCost > 0 && `Diamond: ₹ ${diamondCost.toLocaleString('en-IN')}`}
                                                        {diamondCost > 0 && makingCharge > 0 && ' + '}
                                                        {makingCharge > 0 && `Making: ₹ ${makingCharge.toLocaleString('en-IN')}`}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-semibold text-slate-900">{item.quantity}</span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="text-sm font-semibold text-slate-900">₹ {lineTotal.toLocaleString('en-IN')}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setProductDetailsModalOpen(item)}
                                                            className="inline-flex items-center gap-1 rounded-full border border-elvee-blue/30 px-2.5 py-1.5 text-[10px] font-semibold text-elvee-blue transition hover:border-elvee-blue hover:bg-elvee-blue/5"
                                                            title="View product details"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openChangeModal(item)}
                                                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                                            title="Change product"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRemoveItemConfirm({ show: true, itemId: item.id });
                                                            }}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                                                            title="Remove item"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                    {(() => {
                                        const subtotal = taxSummary ? taxSummary.subtotal : allQuotations.reduce((acc, item) => {
                                            const priceBreakdown = item.price_breakdown || {};
                                            const metalCost = Number(priceBreakdown.metal) || 0;
                                            const diamondCost = Number(priceBreakdown.diamond) || 0;
                                            const makingCharge = Number(priceBreakdown.making) || 0;
                                            const unitTotal = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                            const quantity = Number(item.quantity) || 0;
                                            return acc + (unitTotal * quantity);
                                        }, 0);
                                        const tax = taxSummary ? taxSummary.tax : 0;
                                        const grandTotal = taxSummary ? taxSummary.total : (subtotal + tax);
                                        
                                        return (
                                            <>
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-2 text-right text-sm text-slate-600">
                                                        Subtotal
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                        ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-2 text-right text-sm text-slate-600">
                                                        GST ({taxRate}%)
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                        ₹ {tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                <tr className="border-t-2 border-slate-300">
                                                    <td colSpan={4} className="px-4 py-3 text-right text-base font-bold text-slate-900">
                                                        Grand Total
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-lg font-bold text-slate-900">
                                                        ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Timeline and Conversation Section */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-6">
                            {/* Linked Order */}
                            {quotation.order && (
                                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                    <h2 className="text-lg font-semibold text-slate-900">Linked Order</h2>
                                    <div className="mt-4 space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Order Reference</p>
                                                <Link
                                                    href={`/admin/orders/${quotation.order.id}`}
                                                    className="mt-1 text-base font-semibold text-sky-600 hover:text-sky-500"
                                                >
                                                    {quotation.order.reference}
                                                </Link>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
                                                <p className="mt-1 text-base font-semibold text-slate-900">{quotation.order.status.replace(/_/g, ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Amount</p>
                                            <p className="mt-1 text-xl font-semibold text-slate-900">₹ {quotation.order.total_amount.toLocaleString('en-IN')}</p>
                                        </div>
                                        {quotation.order.history && quotation.order.history.length > 0 && (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Status Timeline</h3>
                                                <div className="mt-3 space-y-2">
                                                    {quotation.order.history.map((entry) => (
                                                        <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                                                            <span className="text-sm font-semibold text-slate-700">{entry.status.replace(/_/g, ' ')}</span>
                                                            <span className="text-xs text-slate-400">{formatDate(entry.created_at)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Quotation Timeline */}
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="text-lg font-semibold text-slate-900">Quotation Timeline</h2>
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Created</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(quotation.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {quotation.approved_at && (
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Approved</p>
                                                    <p className="mt-1 text-sm font-semibold text-emerald-900">{formatDate(quotation.approved_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {quotation.updated_at && quotation.updated_at !== quotation.created_at && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Last Updated</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(quotation.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Conversation */}
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
                                <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-2 text-sm text-slate-600">
                                    {(!quotation.messages || quotation.messages.length === 0) && (
                                        <p className="text-xs text-slate-400">No messages yet. Start by sending the customer a note below.</p>
                                    )}
                                    {quotation.messages && quotation.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 ${
                                                message.sender === 'admin'
                                                    ? 'border-slate-200 bg-slate-50'
                                                    : 'border-sky-200 bg-sky-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-slate-400">
                                                <span className="font-semibold">{message.sender === 'admin' ? (message.author ?? 'Admin') : 'Customer'}</span>
                                                <span>{formatDate(message.created_at)}</span>
                                            </div>
                                            <p className="whitespace-pre-line text-sm text-slate-700">{message.message}</p>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="mt-4 space-y-3 text-sm text-slate-600">
                                    <label className="flex flex-col gap-2">
                                        <span className="text-xs font-semibold text-slate-800">Send Message</span>
                                        <textarea
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            className="min-h-[100px] rounded-2xl border border-slate-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Request more information or share updates with the client..."
                                            disabled={messageProcessing}
                                        />
                                    </label>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={messageProcessing || !messageText.trim()}
                                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {messageProcessing ? 'Sending…' : 'Send message'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <aside className="space-y-6">
                            {/* Admin Notes */}
                            {quotation.admin_notes && (
                                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                    <h2 className="text-lg font-semibold text-slate-900">Admin Notes</h2>
                                    <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{quotation.admin_notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="mb-4 text-lg font-semibold text-slate-900">Actions</h2>
                                
                                <form onSubmit={handleAction} className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Action</label>
                                        <select
                                            value={actionType}
                                            onChange={(e) => setActionType(e.target.value as any)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        >
                                            <option value="">Select an action...</option>
                                            {(quotation.status === 'pending' || quotation.status === 'customer_confirmed') && (
                                                <option value="approve">Approve Quotation</option>
                                            )}
                                            {quotation.status !== 'rejected' && (
                                                <option value="reject">Reject Quotation</option>
                                            )}
                                            <option value="request_confirmation">Request Customer Confirmation</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            {actionType === 'approve' ? 'Internal Notes' : actionType === 'reject' ? 'Reason / Feedback' : 'Notes'}
                                        </label>
                                        <textarea
                                            value={actionNotes}
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder={
                                                actionType === 'approve' ? 'Add internal notes...' :
                                                actionType === 'reject' ? 'Add reason for rejection...' :
                                                actionType === 'request_confirmation' ? 'Explain changes or pricing impact...' :
                                                'Add notes...'
                                            }
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!actionType || actionProcessing}
                                        className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 ${
                                            actionType === 'approve' ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500' :
                                            actionType === 'reject' ? 'bg-rose-600 shadow-rose-600/30 hover:bg-rose-500' :
                                            'bg-sky-600 shadow-sky-600/30 hover:bg-sky-500'
                                        }`}
                                    >
                                        {actionProcessing ? 'Processing…' : 
                                         actionType === 'approve' ? 'Approve Quotation' :
                                         actionType === 'reject' ? 'Reject Quotation' :
                                         'Request Confirmation'}
                                    </button>
                                </form>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Product Details Modal - Enhanced */}
            {productDetailsModalOpen && (
                <Modal
                    show={!!productDetailsModalOpen}
                    onClose={() => setProductDetailsModalOpen(null)}
                    maxWidth="4xl"
                >
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-900">Product Details</h3>
                                <button
                                    type="button"
                                    onClick={() => setProductDetailsModalOpen(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-6">
                                {/* Product Image and Basic Info */}
                                <div className="flex gap-6">
                                    {productDetailsModalOpen.product.media?.[0] && (
                                        <img
                                            src={getMediaUrl(productDetailsModalOpen.product.media[0].url)}
                                            alt={productDetailsModalOpen.product.media[0].alt || productDetailsModalOpen.product.name}
                                            className="h-32 w-32 rounded-lg object-cover shadow-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-xl font-semibold text-slate-900">{productDetailsModalOpen.product.name}</h4>
                                        <p className="mt-1 text-sm text-slate-500">SKU: {productDetailsModalOpen.product.sku}</p>
                                        <div className="mt-3 flex gap-2">
                                            <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                                                Qty: {productDetailsModalOpen.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                {productDetailsModalOpen.price_breakdown && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <h5 className="mb-3 text-sm font-semibold text-slate-700">Pricing</h5>
                                <div className="space-y-2 text-sm">
                                    {(() => {
                                        const priceBreakdown = productDetailsModalOpen.price_breakdown || {};
                                        const metalCost = Number(priceBreakdown.metal) || 0;
                                        const diamondCost = Number(priceBreakdown.diamond) || 0;
                                        const makingCharge = Number(priceBreakdown.making) || 0;
                                        const total = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                        
                                        return (
                                            <>
                                                {metalCost > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Metal:</span>
                                                        <span className="font-semibold text-slate-900">₹ {metalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                {diamondCost > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Diamond:</span>
                                                        <span className="font-semibold text-slate-900">₹ {diamondCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                {makingCharge > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Making Charge:</span>
                                                        <span className="font-semibold text-slate-900">₹ {makingCharge.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                <div className="border-t border-slate-300 pt-2">
                                                    <div className="flex justify-between">
                                                        <span className="font-semibold text-slate-900">Unit Price:</span>
                                                        <span className="font-semibold text-slate-900">
                                                            ₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                    );
                                })()}
                                </div>
                            </div>
                        )}

                                {/* Selected Variant */}
                                {productDetailsModalOpen.variant && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <h5 className="mb-3 text-sm font-semibold text-slate-700">Selected Variant</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Label:</span>
                                        <span className="font-semibold text-slate-900">{productDetailsModalOpen.variant.label}</span>
                                    </div>
                                    {productDetailsModalOpen.variant.metadata && Object.keys(productDetailsModalOpen.variant.metadata).length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            <p className="text-xs font-semibold text-slate-500">Variant Details:</p>
                                            {Object.entries(productDetailsModalOpen.variant.metadata).map(([key, value]) => (
                                                <div key={key} className="flex justify-between text-xs">
                                                    <span className="text-slate-600">{key.replace(/_/g, ' ')}:</span>
                                                    <span className="font-medium text-slate-900">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                                {/* Notes */}
                                {productDetailsModalOpen.notes && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <h5 className="mb-3 text-sm font-semibold text-slate-700">Notes</h5>
                                        <p className="whitespace-pre-line text-sm text-slate-700">{productDetailsModalOpen.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Change Product Modal */}
            {changeProductModalOpen && (
                <Modal
                    show={!!changeProductModalOpen}
                    onClose={closeChangeModal}
                    maxWidth="4xl"
                >
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-900">Change Product</h3>
                                <button
                                    type="button"
                                    onClick={closeChangeModal}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                            <form onSubmit={handleChangeProduct} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Search Product</label>
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setIsManualSearch(true);
                                }}
                                placeholder="Type product name or SKU..."
                                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => selectProduct(product)}
                                            className="w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50"
                                        >
                                            <div className="font-semibold text-slate-900">{product.name}</div>
                                            <div className="text-xs text-slate-400">SKU {product.sku}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedProduct && (
                            <>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Selected Product</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedProduct.name}</p>
                                    <p className="text-xs text-slate-400">SKU {selectedProduct.sku}</p>
                                </div>

                                {selectedProduct.variants.length > 0 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">Metal</label>
                                            <select
                                                value={changeProductMetalId}
                                                onChange={(e) => {
                                                    setChangeProductMetalId(Number(e.target.value) || '');
                                                    setChangeProductPurityId('');
                                                    setChangeProductToneId('');
                                                    setChangeProductSize('');
                                                }}
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select Metal</option>
                                                {changeProductAvailableMetals.map(([id, name]) => (
                                                    <option key={id} value={id}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {changeProductMetalId && (
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-700">Purity</label>
                                                <select
                                                    value={changeProductPurityId}
                                                    onChange={(e) => {
                                                        setChangeProductPurityId(Number(e.target.value) || '');
                                                        setChangeProductToneId('');
                                                        setChangeProductSize('');
                                                    }}
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                >
                                                    <option value="">Select Purity</option>
                                                    {changeProductAvailablePurities.map(([id, name]) => (
                                                        <option key={id} value={id}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {changeProductPurityId && (
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-700">Tone</label>
                                                <select
                                                    value={changeProductToneId}
                                                    onChange={(e) => {
                                                        setChangeProductToneId(Number(e.target.value) || '');
                                                        setChangeProductSize('');
                                                    }}
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                >
                                                    <option value="">Select Tone</option>
                                                    {changeProductAvailableTones.map(([id, name]) => (
                                                        <option key={id} value={id}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {changeProductAvailableSizes.length > 0 && changeProductToneId && (
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-700">Size</label>
                                                <select
                                                    value={changeProductSize}
                                                    onChange={(e) => setChangeProductSize(e.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                >
                                                    <option value="">Select Size</option>
                                                    {changeProductAvailableSizes.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label>
                                    <input
                                        type="number"
                                        value={changeProductQuantity}
                                        onChange={(e) => setChangeProductQuantity(parseInt(e.target.value) || 1)}
                                        min={1}
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Notes (optional)</label>
                                    <textarea
                                        value={changeProductNotes}
                                        onChange={(e) => setChangeProductNotes(e.target.value)}
                                        placeholder="Add notes about this change..."
                                        rows={3}
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={closeChangeModal}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                                <button
                                    type="submit"
                                    disabled={changeProductProcessing || !selectedProduct || !changeProductVariantId}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {changeProductProcessing ? 'Updating...' : 'Update Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
            )}

            {/* Add Item Modal */}
            {addItemModalOpen && (
                <Modal
                    show={addItemModalOpen}
                    onClose={closeAddItemModal}
                    maxWidth="4xl"
                >
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-900">Add Item</h3>
                                <button
                                    type="button"
                                    onClick={closeAddItemModal}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Search Product</label>
                            <input
                                type="text"
                                value={addItemProductSearch}
                                onChange={(e) => {
                                    setAddItemProductSearch(e.target.value);
                                    setIsManualAddItemSearch(true);
                                }}
                                placeholder="Type product name or SKU..."
                                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            {addItemSearchResults.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                    {addItemSearchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => selectAddItemProduct(product)}
                                            className="w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50"
                                        >
                                            <div className="font-semibold text-slate-900">{product.name}</div>
                                            <div className="text-xs text-slate-400">SKU {product.sku}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {addItemSelectedProduct && (
                            <>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Selected Product</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{addItemSelectedProduct.name}</p>
                                    <p className="text-xs text-slate-400">SKU {addItemSelectedProduct.sku}</p>
                                </div>

                                {addItemSelectedProduct.variants.length > 0 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-slate-700">Metal</label>
                                            <select
                                                value={addItemMetalId}
                                                onChange={(e) => {
                                                    setAddItemMetalId(Number(e.target.value) || '');
                                                    setAddItemPurityId('');
                                                    setAddItemToneId('');
                                                    setAddItemSize('');
                                                }}
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select Metal</option>
                                                {addItemAvailableMetals.map(([id, name]) => (
                                                    <option key={id} value={id}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {addItemMetalId && (
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-700">Purity</label>
                                                <select
                                                    value={addItemPurityId}
                                                    onChange={(e) => {
                                                        setAddItemPurityId(Number(e.target.value) || '');
                                                        setAddItemToneId('');
                                                        setAddItemSize('');
                                                    }}
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                >
                                                    <option value="">Select Purity</option>
                                                    {addItemAvailablePurities.map(([id, name]) => (
                                                        <option key={id} value={id}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {addItemPurityId && (
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-700">Tone</label>
                                                <select
                                                    value={addItemToneId}
                                                    onChange={(e) => {
                                                        setAddItemToneId(Number(e.target.value) || '');
                                                        setAddItemSize('');
                                                    }}
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                >
                                                    <option value="">Select Tone</option>
                                                    {addItemAvailableTones.map(([id, name]) => (
                                                        <option key={id} value={id}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {addItemAvailableSizes.length > 0 && addItemToneId && (
                                            <div>
                                                <label className="mb-2 block text-sm font-semibold text-slate-700">Size</label>
                                                <select
                                                    value={addItemSize}
                                                    onChange={(e) => setAddItemSize(e.target.value)}
                                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                >
                                                    <option value="">Select Size</option>
                                                    {addItemAvailableSizes.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Quantity</label>
                                    <input
                                        type="number"
                                        value={addItemQuantity}
                                        onChange={(e) => setAddItemQuantity(parseInt(e.target.value) || 1)}
                                        min={1}
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Notes (optional)</label>
                                    <textarea
                                        value={addItemNotes}
                                        onChange={(e) => setAddItemNotes(e.target.value)}
                                        placeholder="Add notes about this item..."
                                        rows={3}
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={closeAddItemModal}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                                <button
                                    type="submit"
                                    disabled={addItemProcessing || !addItemSelectedProduct || !addItemVariantId}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {addItemProcessing ? 'Adding...' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
            )}

            {/* Remove Item Confirmation Modal */}
            <ConfirmationModal
                show={removeItemConfirm.show && removeItemConfirm.itemId !== null}
                onClose={() => setRemoveItemConfirm({ show: false, itemId: null })}
                onConfirm={handleRemoveItem}
                title="Remove Item"
                message="Are you sure you want to remove this item from the quotation?"
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
                processing={removeItemProcessing}
            />
        </>
    );
}
