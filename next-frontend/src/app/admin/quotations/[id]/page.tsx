'use client';

import React, { useState, useEffect, use } from 'react';
import { Head } from '@/components/Head';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toastError, toastWarning } from '@/utils/toast';
import { getMediaUrl } from '@/utils/mediaUrl';

type RelatedQuotation = {
    quotation_group_id: string;
    status: string;
    quantity: number;
    notes?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt?: string }>;
        variants?: Array<{
            id: number | string;
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
        }>;
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
    quotation_group_id: string;
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
        variants?: Array<{
            id: number | string;
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
        }>;
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
    const quotationGroupId = resolvedParams.id; // Now treated as quotation_group_id (string)
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
    const [hasChanges, setHasChanges] = useState(false);
    
    // Messages state
    const [messageText, setMessageText] = useState('');
    const [messageProcessing, setMessageProcessing] = useState(false);
    const [companySettings, setCompanySettings] = useState<any>(null);

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
    const changeProductInitializedRef = React.useRef<string | null>(null);
    const pendingInitializationRef = React.useRef<{
        metalId: number;
        purityId: number | null;
        toneId: number | null;
        size: string;
        variantId: number;
    } | null>(null);

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

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await adminService.getGeneralSettings();
                if (response?.data) {
                    setCompanySettings(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch company settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            const response = await adminService.getQuotation(quotationGroupId);
            if (response.data) {
                setQuotation(response.data);
                // Update hasChanges based on status (like Laravel)
                setHasChanges(response.data.status === 'pending_customer_confirmation');
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
            quotation_group_id: quotation.quotation_group_id,
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
            await adminService.deleteQuotation(quotationGroupId);
            setRemoveItemConfirm({ show: false, itemId: null });
            // Reload quotation to get updated data
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to remove item:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to remove item';
            toastError(errorMessage);
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
                await adminService.approveQuotation(quotationGroupId, actionNotes || undefined);
            } else if (actionType === 'reject') {
                await adminService.rejectQuotation(quotationGroupId, actionNotes || undefined);
            } else if (actionType === 'request_confirmation') {
                await adminService.requestQuotationConfirmation(quotationGroupId, {
                    notes: actionNotes || undefined,
                });
                // Reset hasChanges after requesting confirmation
                setHasChanges(false);
            }
            setActionType('');
            setActionNotes('');
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to perform action:', error);
            toastError(error.response?.data?.message || 'Failed to perform action');
        } finally {
            setActionProcessing(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        
        try {
            setMessageProcessing(true);
            await adminService.sendQuotationMessage(quotationGroupId, messageText);
            setMessageText('');
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to send message:', error);
            toastError(error.response?.data?.message || 'Failed to send message');
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


    // Initialize values when configuration options are ready (after openChangeModal sets pendingInitializationRef)
    useEffect(() => {
        if (!pendingInitializationRef.current || changeProductConfigurationOptions.length === 0) return;
        
        const pending = pendingInitializationRef.current;
        
        // Set metal first (always set if not already set)
        if (changeProductMetalId !== pending.metalId) {
            setChangeProductMetalId(pending.metalId);
            return; // Wait for next render cycle
        }
        
        // Set purity after metal is set and matches
        if (changeProductMetalId === pending.metalId && pending.purityId && changeProductPurityId !== pending.purityId) {
            // Check if purity exists in available options
            const hasPurity = changeProductAvailablePurities.length > 0 && changeProductAvailablePurities.some(([id]) => Number(id) === Number(pending.purityId));
            if (hasPurity) {
                setChangeProductPurityId(pending.purityId);
            } else if (changeProductAvailablePurities.length > 0) {
                // If purities are available but our target isn't, something is wrong - clear and continue
                console.warn('Target purity not found in available options', pending.purityId, changeProductAvailablePurities);
            }
            return; // Wait for next render cycle
        }
        
        // Set tone after purity is set and matches
        if (changeProductPurityId === pending.purityId && pending.toneId && changeProductToneId !== pending.toneId) {
            // Check if tone exists in available options
            const hasTone = changeProductAvailableTones.length > 0 && changeProductAvailableTones.some(([id]) => Number(id) === Number(pending.toneId));
            if (hasTone) {
                setChangeProductToneId(pending.toneId);
            } else if (changeProductAvailableTones.length > 0) {
                console.warn('Target tone not found in available options', pending.toneId, changeProductAvailableTones);
            }
            return; // Wait for next render cycle
        }
        
        // Set size and variant after tone is set and matches
        if (changeProductToneId === pending.toneId) {
            if (pending.size && changeProductSize !== pending.size) {
                setChangeProductSize(pending.size);
            }
            if (!changeProductVariantId || changeProductVariantId !== pending.variantId) {
                setChangeProductVariantId(pending.variantId);
            }
            // Clear pending initialization after all values are set
            if (changeProductSize === pending.size && changeProductVariantId === pending.variantId) {
                pendingInitializationRef.current = null;
                changeProductInitializedRef.current = null;
            }
        }
    }, [
        changeProductConfigurationOptions.length,
        changeProductMetalId,
        changeProductPurityId,
        changeProductToneId,
        changeProductSize,
        changeProductVariantId,
        changeProductAvailablePurities,
        changeProductAvailableTones,
    ]);

    // Auto-match variant for Change Product modal
    useEffect(() => {
        // Skip if we're still initializing from modal open
        if (!changeProductModalOpen) return;
        
        // Skip if we have pending initialization
        if (pendingInitializationRef.current !== null) return;
        
        // Reset dependent fields when parent changes (like Laravel) - only if user is changing, not initializing
        if (!changeProductMetalId) {
            if (changeProductPurityId || changeProductToneId || changeProductSize) {
                setChangeProductPurityId('');
                setChangeProductToneId('');
                setChangeProductSize('');
                setChangeProductVariantId('');
            }
            return;
        }
        if (!changeProductPurityId) {
            if (changeProductToneId || changeProductSize) {
                setChangeProductToneId('');
                setChangeProductSize('');
                setChangeProductVariantId('');
            }
            return;
        }
        if (!changeProductToneId) {
            if (changeProductSize) {
                setChangeProductSize('');
                setChangeProductVariantId('');
            }
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
    }, [changeProductMetalId, changeProductPurityId, changeProductToneId, changeProductSize, changeProductAvailableSizes.length, changeProductConfigurationOptions, changeProductModalOpen]);

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

    // Open Change Product Modal (matching Laravel implementation)
    const openChangeModal = (item: RelatedQuotation) => {
        setChangeProductModalOpen(item);
        setIsManualSearch(false);
        setProductSearch(item.product.name);
        setChangeProductQuantity(item.quantity);
        setChangeProductNotes('');
        setSearchResults([]);
        
        // Use product.variants from quotation data if available (like Laravel)
        if (item.product.variants && item.product.variants.length > 0) {
            // Map variants to match SelectedProduct type
            const mappedVariants = item.product.variants.map((v: any) => ({
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
                    metal_purity_id: m.metal_purity?.id ? Number(m.metal_purity.id) : null,
                    metal_tone_id: m.metal_tone?.id ? Number(m.metal_tone.id) : null,
                    metal: m.metal ? { id: Number(m.metal.id), name: m.metal.name } : null,
                    metal_purity: m.metal_purity ? { id: Number(m.metal_purity.id), name: m.metal_purity.name } : null,
                    metal_tone: m.metal_tone ? { id: Number(m.metal_tone.id), name: m.metal_tone.name } : null,
                })),
            }));
            
            setSelectedProduct({
                id: item.product.id,
                name: item.product.name,
                sku: item.product.sku,
                variants: mappedVariants,
            });
            
            // Reset values first
            setChangeProductMetalId('');
            setChangeProductPurityId('');
            setChangeProductToneId('');
            setChangeProductSize('');
            setChangeProductVariantId('');
            
            // Store target values in ref for useEffect to pick up (matching Laravel's direct setting approach)
            if (item.variant && mappedVariants.length > 0) {
                const selectedVariant = mappedVariants.find(v => v.id === Number(item.variant?.id));
                if (selectedVariant?.metals && selectedVariant.metals.length > 0) {
                    const firstMetal = selectedVariant.metals[0];
                    const quotationGroupId = item.quotation_group_id;
                    changeProductInitializedRef.current = quotationGroupId;
                    
                    // Store target values - useEffect will set them when configuration options are ready
                    pendingInitializationRef.current = {
                        metalId: firstMetal.metal_id,
                        purityId: firstMetal.metal_purity_id,
                        toneId: firstMetal.metal_tone_id,
                        size: selectedVariant.size ? (selectedVariant.size.value || selectedVariant.size.name) : '',
                        variantId: selectedVariant.id,
                    };
                } else {
                    pendingInitializationRef.current = null;
                    changeProductInitializedRef.current = null;
                }
            } else {
                pendingInitializationRef.current = null;
                changeProductInitializedRef.current = null;
            }
        } else {
            // Fallback: Fetch product with variants if not in quotation data
            // Reset values
            setChangeProductMetalId('');
            setChangeProductPurityId('');
            setChangeProductToneId('');
            setChangeProductSize('');
            setChangeProductVariantId('');
            
            fetchProductWithVariants(item.product.id, (product) => {
                setSelectedProduct(product);
                if (item.variant?.id) {
                    const currentVariant = product.variants.find(v => v.id === Number(item.variant?.id));
                    if (currentVariant?.metals && currentVariant.metals.length > 0) {
                        const firstMetal = currentVariant.metals[0];
                        const quotationGroupId = item.quotation_group_id;
                        changeProductInitializedRef.current = quotationGroupId;
                        
                        // Store target values - useEffect will set them when configuration options are ready
                        pendingInitializationRef.current = {
                            metalId: firstMetal.metal_id,
                            purityId: firstMetal.metal_purity_id,
                            toneId: firstMetal.metal_tone_id,
                            size: currentVariant.size ? (currentVariant.size.value || currentVariant.size.name) : '',
                            variantId: currentVariant.id,
                        };
                    } else {
                        pendingInitializationRef.current = null;
                        changeProductInitializedRef.current = null;
                    }
                } else {
                    pendingInitializationRef.current = null;
                    changeProductInitializedRef.current = null;
                }
            });
        }
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
        changeProductInitializedRef.current = null; // Reset initialization flag
        pendingInitializationRef.current = null; // Clear pending initialization
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
            toastWarning('Please select a product and complete customization');
            return;
        }

        try {
            setChangeProductProcessing(true);
            await adminService.updateQuotationProduct(quotationGroupId, {
                product_id: selectedProduct.id,
                product_variant_id: Number(changeProductVariantId),
                quantity: changeProductQuantity,
                admin_notes: changeProductNotes || undefined,
            });
            closeChangeModal();
            // Reset action type after product update
            setActionType('');
            setActionNotes('');
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to update product:', error);
            toastError(error.response?.data?.message || 'Failed to update product');
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
            toastWarning('Please select a product and complete customization');
            return;
        }

        try {
            setAddItemProcessing(true);
            await adminService.addQuotationItem(quotationGroupId, {
                product_id: addItemSelectedProduct.id,
                product_variant_id: Number(addItemVariantId),
                quantity: addItemQuantity,
                admin_notes: addItemNotes || undefined,
            });
            closeAddItemModal();
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to add item:', error);
            toastError(error.response?.data?.message || 'Failed to add item');
        } finally {
            setAddItemProcessing(false);
        }
    };

    if (loading) {
        return (
            <>
                <Head title={`Quotation ${quotationGroupId}`} />
                <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                </div>
            </>
        );
    }

    if (!quotation) {
        return (
            <>
                <Head title={`Quotation ${quotationGroupId}`} />
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

            <div className="space-y-6 sm:space-y-8 px-1 py-4 sm:px-6 sm:py-6 lg:px-8">
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Quotation {quotationGroupId}</h1>
                        <Link
                            href="/admin/quotations"
                            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-3">
                            <div>
                                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">From</h3>
                                {companySettings ? (
                                    <>
                                        <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">
                                            {companySettings.company_name || 'Elvee'}
                                        </p>
                                        {companySettings.company_address && (
                                            <p className="mt-1 text-xs sm:text-sm text-slate-600">
                                                {companySettings.company_address}
                                            </p>
                                        )}
                                        {(companySettings.company_city || companySettings.company_state || companySettings.company_pincode) && (
                                            <p className="text-xs sm:text-sm text-slate-600">
                                                {[companySettings.company_city, companySettings.company_state, companySettings.company_pincode]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        )}
                                        {companySettings.company_phone && (
                                            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
                                                Phone: {companySettings.company_phone}
                                            </p>
                                        )}
                                        {companySettings.company_email && (
                                            <p className="text-xs sm:text-sm text-slate-600">
                                                Email: {companySettings.company_email}
                                            </p>
                                        )}
                                        {companySettings.company_gstin && (
                                            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">
                                                GSTIN: {companySettings.company_gstin}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">Elvee</p>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-600">123 Business Street</p>
                                        <p className="text-xs sm:text-sm text-slate-600">Mumbai, Maharashtra 400001</p>
                                    </>
                                )}
                            </div>
                            <div>
                                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bill To</h3>
                                <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">{quotation.user?.name ?? 'Unknown'}</p>
                                <p className="mt-1 text-xs sm:text-sm text-slate-600 break-words">{quotation.user?.email ?? '—'}</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Quotation Details</h3>
                                <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">{quotationGroupId}</p>
                                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                    Date: <span className="font-semibold text-slate-900">{quotation.created_at && formatDate(quotation.created_at)}</span>
                                </p>
                                <div className="mt-2 sm:mt-3 flex sm:justify-end gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${
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
                    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Items</h2>
                            <button
                                type="button"
                                onClick={openAddItemModal}
                                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 sm:px-4 sm:py-2 sm:text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead className="border-b-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Item</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Unit Price</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Qty</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Total</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allQuotations.map((item, index) => {
                                        const priceBreakdown = item.price_breakdown || {};
                                        const metalCost = Number(priceBreakdown.metal) || 0;
                                        const diamondCost = Number(priceBreakdown.diamond) || 0;
                                        const makingCharge = Number(priceBreakdown.making) || 0;
                                        const unitPrice = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                        const lineTotal = unitPrice * (Number(item.quantity) || 0);
                                        const variantLabel = item.variant?.metadata?.auto_label as string || item.variant?.label || '';
                                        // Use composite key: quotation_group_id + product.id + variant.id (if exists) + index as fallback
                                        const uniqueKey = `${item.quotation_group_id}-${item.product.id}-${item.variant?.id || 'no-variant'}-${index}`;
                                        
                                        return (
                                            <tr key={uniqueKey} className="hover:bg-slate-50/50 transition">
                                                <td className="px-3 py-3 sm:px-4 sm:py-4">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        {item.product.media?.[0] && getMediaUrl(item.product.media[0].url) && (
                                                            <img
                                                                src={getMediaUrl(item.product.media[0].url)!}
                                                                alt={item.product.media[0].alt || item.product.name}
                                                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover shadow-sm"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-semibold text-slate-900">{item.product.name}</p>
                                                            <p className="text-[10px] sm:text-xs text-slate-400">SKU {item.product.sku}</p>
                                                            {variantLabel && (
                                                                <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-slate-500">
                                                                    {variantLabel}
                                                                </p>
                                                            )}
                                                            {item.notes && (
                                                                <p className="mt-1 text-[10px] sm:text-xs text-slate-500 italic">Note: {item.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                                                    <div className="text-xs sm:text-sm font-semibold text-slate-900">₹ {unitPrice.toLocaleString('en-IN')}</div>
                                                    <div className="text-[10px] sm:text-xs text-slate-400">
                                                        {metalCost > 0 && `Metal: ₹ ${metalCost.toLocaleString('en-IN')}`}
                                                        {metalCost > 0 && (diamondCost > 0 || makingCharge > 0) && ' + '}
                                                        {diamondCost > 0 && `Diamond: ₹ ${diamondCost.toLocaleString('en-IN')}`}
                                                        {diamondCost > 0 && makingCharge > 0 && ' + '}
                                                        {makingCharge > 0 && `Making: ₹ ${makingCharge.toLocaleString('en-IN')}`}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                                                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{item.quantity}</span>
                                                </td>
                                                <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                                                    <div className="text-xs sm:text-sm font-semibold text-slate-900">₹ {lineTotal.toLocaleString('en-IN')}</div>
                                                </td>
                                                <td className="px-3 py-3 sm:px-4 sm:py-4">
                                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setProductDetailsModalOpen(item)}
                                                            className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-elvee-blue/30 px-1.5 py-1 text-[10px] font-semibold text-elvee-blue transition hover:border-elvee-blue hover:bg-elvee-blue/5 sm:px-2.5 sm:py-1.5"
                                                            title="View product details"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-2.5 w-2.5 sm:h-3 sm:w-3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openChangeModal(item)}
                                                            className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-slate-300 px-1.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:px-2.5 sm:py-1.5"
                                                            title="Change product"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-2.5 w-2.5 sm:h-3 sm:w-3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRemoveItemConfirm({ show: true, itemId: item.quotation_group_id });
                                                            }}
                                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                                            title="Remove item"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
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
                                                    <td colSpan={4} className="px-3 py-2 text-right text-xs sm:text-sm text-slate-600 sm:px-4">
                                                        Subtotal
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-xs sm:text-sm font-semibold text-slate-900 sm:px-4">
                                                        ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={4} className="px-3 py-2 text-right text-xs sm:text-sm text-slate-600 sm:px-4">
                                                        GST ({taxRate}%)
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-xs sm:text-sm font-semibold text-slate-900 sm:px-4">
                                                        ₹ {tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                <tr className="border-t-2 border-slate-300">
                                                    <td colSpan={4} className="px-3 py-2.5 sm:py-3 text-right text-sm sm:text-base font-bold text-slate-900 sm:px-4">
                                                        Grand Total
                                                    </td>
                                                    <td className="px-3 py-2.5 sm:py-3 text-right text-base sm:text-lg font-bold text-slate-900 sm:px-4">
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
                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Linked Order */}
                            {quotation.order && (
                                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Linked Order</h2>
                                    <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Order Reference</p>
                                                <Link
                                                    href={`/admin/orders/${quotation.order.id}`}
                                                    className="mt-1 text-sm sm:text-base font-semibold text-sky-600 hover:text-sky-500 break-words"
                                                >
                                                    {quotation.order.reference}
                                                </Link>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
                                                <p className="mt-1 text-sm sm:text-base font-semibold text-slate-900">{quotation.order.status.replace(/_/g, ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3 sm:col-span-2">
                                            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Amount</p>
                                            <p className="mt-1 text-base sm:text-lg lg:text-xl font-semibold text-slate-900">₹ {quotation.order.total_amount.toLocaleString('en-IN')}</p>
                                        </div>
                                        {quotation.order.history && quotation.order.history.length > 0 && (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                                <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Status Timeline</h3>
                                                <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                                                    {quotation.order.history.map((entry) => (
                                                        <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2">
                                                            <span className="text-xs sm:text-sm font-semibold text-slate-700">{entry.status.replace(/_/g, ' ')}</span>
                                                            <span className="text-[10px] sm:text-xs text-slate-400">{formatDate(entry.created_at)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Quotation Timeline */}
                            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Quotation Timeline</h2>
                                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Created</p>
                                                <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{formatDate(quotation.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {quotation.approved_at && (
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Approved</p>
                                                    <p className="mt-1 text-xs sm:text-sm font-semibold text-emerald-900">{formatDate(quotation.approved_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {quotation.updated_at && quotation.updated_at !== quotation.created_at && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Last Updated</p>
                                                    <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{formatDate(quotation.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Conversation */}
                            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Conversation</h2>
                                <div className="mt-3 sm:mt-4 max-h-64 sm:max-h-96 space-y-2 sm:space-y-3 overflow-y-auto pr-1 sm:pr-2 text-xs sm:text-sm text-slate-600">
                                    {(!quotation.messages || quotation.messages.length === 0) && (
                                        <p className="text-[10px] sm:text-xs text-slate-400">No messages yet. Start by sending the customer a note below.</p>
                                    )}
                                    {quotation.messages && quotation.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col gap-1.5 sm:gap-2 rounded-2xl border px-3 py-2 sm:px-4 sm:py-3 ${
                                                message.sender === 'admin'
                                                    ? 'border-slate-200 bg-slate-50'
                                                    : 'border-sky-200 bg-sky-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-slate-400">
                                                <span className="font-semibold">{message.sender === 'admin' ? (message.author ?? 'Admin') : 'Customer'}</span>
                                                <span>{formatDate(message.created_at)}</span>
                                            </div>
                                            <p className="whitespace-pre-line text-xs sm:text-sm text-slate-700">{message.message}</p>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
                                    <label className="flex flex-col gap-1.5 sm:gap-2">
                                        <span className="text-[10px] sm:text-xs font-semibold text-slate-800">Send Message</span>
                                        <textarea
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            className="min-h-[80px] sm:min-h-[100px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm"
                                            placeholder="Request more information or share updates with the client..."
                                            disabled={messageProcessing}
                                        />
                                    </label>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={messageProcessing || !messageText.trim()}
                                            className="rounded-full bg-sky-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
                                        >
                                            {messageProcessing ? 'Sending…' : 'Send message'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <aside className="space-y-4 sm:space-y-6">
                            {/* Admin Notes */}
                            {quotation.admin_notes && (
                                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Admin Notes</h2>
                                    <p className="mt-2 sm:mt-3 whitespace-pre-line text-xs sm:text-sm text-slate-600">{quotation.admin_notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-900">Actions</h2>
                                
                                {hasChanges && (
                                    <div className="mb-3 sm:mb-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-2.5 sm:p-3">
                                        <p className="text-xs sm:text-sm font-semibold text-amber-800">Changes detected</p>
                                        <p className="mt-1 text-[10px] sm:text-xs text-amber-700">Product or quantity has been modified. Request customer confirmation to save changes.</p>
                                    </div>
                                )}
                                
                                <form onSubmit={handleAction} className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Action</label>
                                        <select
                                            value={actionType}
                                            onChange={(e) => setActionType(e.target.value as any)}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
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
                                        <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">
                                            {actionType === 'approve' ? 'Internal Notes' : actionType === 'reject' ? 'Reason / Feedback' : 'Notes'}
                                        </label>
                                        <textarea
                                            value={actionNotes}
                                            onChange={(e) => setActionNotes(e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
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
                                        className={`w-full rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 sm:text-sm ${
                                            actionType === 'approve' ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500' :
                                            actionType === 'reject' ? 'bg-rose-600 shadow-rose-600/30 hover:bg-rose-500' :
                                            hasChanges ? 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-500' :
                                            'bg-sky-600 shadow-sky-600/30 hover:bg-sky-500'
                                        }`}
                                    >
                                        {actionProcessing ? 'Processing…' : 
                                         actionType === 'approve' ? 'Approve Quotation' :
                                         actionType === 'reject' ? 'Reject Quotation' :
                                         hasChanges ? 'Request Confirmation (Changes Pending)' :
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
                        <div className="flex-shrink-0 border-b border-slate-200 px-4 py-2.5 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Product Details</h3>
                                <button
                                    type="button"
                                    onClick={() => setProductDetailsModalOpen(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 sm:h-5 sm:w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                            <div className="space-y-4 sm:space-y-6">
                                {/* Product Image and Basic Info */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                                    {productDetailsModalOpen.product.media?.[0] && getMediaUrl(productDetailsModalOpen.product.media[0].url) && (
                                        <img
                                            src={getMediaUrl(productDetailsModalOpen.product.media[0].url)!}
                                            alt={productDetailsModalOpen.product.media[0].alt || productDetailsModalOpen.product.name}
                                            className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg object-cover shadow-lg mx-auto sm:mx-0"
                                        />
                                    )}
                                    <div className="flex-1 text-center sm:text-left">
                                        <h4 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">{productDetailsModalOpen.product.name}</h4>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-500">SKU: {productDetailsModalOpen.product.sku}</p>
                                        <div className="mt-2 sm:mt-3 flex justify-center sm:justify-start gap-2">
                                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-slate-700">
                                                Qty: {productDetailsModalOpen.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                {productDetailsModalOpen.price_breakdown && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                <h5 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-700">Pricing</h5>
                                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                    {(() => {
                                        const priceBreakdown = productDetailsModalOpen.price_breakdown || {};
                                        const metalCost = Number(priceBreakdown.metal) || 0;
                                        const diamondCost = Number(priceBreakdown.diamond) || 0;
                                        const makingCharge = Number(priceBreakdown.making) || 0;
                                        const total = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                        
                                        return (
                                            <>
                                                {metalCost > 0 && (
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-slate-600">Metal:</span>
                                                        <span className="font-semibold text-slate-900 text-right">₹ {metalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                {diamondCost > 0 && (
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-slate-600">Diamond:</span>
                                                        <span className="font-semibold text-slate-900 text-right">₹ {diamondCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                {makingCharge > 0 && (
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-slate-600">Making Charge:</span>
                                                        <span className="font-semibold text-slate-900 text-right">₹ {makingCharge.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                <div className="border-t border-slate-300 pt-2 mt-2">
                                                    <div className="flex justify-between gap-2">
                                                        <span className="font-semibold text-slate-900">Unit Price:</span>
                                                        <span className="font-semibold text-slate-900 text-right">
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
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                <h5 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-700">Selected Variant</h5>
                                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                        <span className="text-slate-600">Label:</span>
                                        <span className="font-semibold text-slate-900 break-words sm:text-right">{productDetailsModalOpen.variant.label}</span>
                                    </div>
                                    {productDetailsModalOpen.variant.metadata && Object.keys(productDetailsModalOpen.variant.metadata).length > 0 && (
                                        <div className="mt-2 sm:mt-3 space-y-1">
                                            <p className="text-[10px] sm:text-xs font-semibold text-slate-500">Variant Details:</p>
                                            {Object.entries(productDetailsModalOpen.variant.metadata).map(([key, value]) => (
                                                <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs">
                                                    <span className="text-slate-600">{key.replace(/_/g, ' ')}:</span>
                                                    <span className="font-medium text-slate-900 break-words sm:text-right">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                                {/* Notes */}
                                {productDetailsModalOpen.notes && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                        <h5 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-700">Notes</h5>
                                        <p className="whitespace-pre-line text-xs sm:text-sm text-slate-700">{productDetailsModalOpen.notes}</p>
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
                        <div className="flex-shrink-0 border-b border-slate-200 px-4 py-2.5 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Change Product</h3>
                                <button
                                    type="button"
                                    onClick={closeChangeModal}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 sm:h-5 sm:w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                            <form onSubmit={handleChangeProduct} className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Search Product</label>
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setIsManualSearch(true);
                                }}
                                placeholder="Type product name or SKU..."
                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            />
                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                    {searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => selectProduct(product)}
                                            className="w-full px-3 py-2 text-left text-xs transition hover:bg-slate-50 sm:px-4 sm:text-sm"
                                        >
                                            <div className="font-semibold text-slate-900">{product.name}</div>
                                            <div className="text-[10px] sm:text-xs text-slate-400">SKU {product.sku}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedProduct && (
                            <>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Selected Product</p>
                                    <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{selectedProduct.name}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">SKU {selectedProduct.sku}</p>
                                </div>

                                {selectedProduct.variants.length > 0 && (
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Metal</label>
                                            <select
                                                value={changeProductMetalId === '' ? '' : String(changeProductMetalId)}
                                                onChange={(e) => {
                                                    setChangeProductMetalId(e.target.value === '' ? '' : Number(e.target.value));
                                                }}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                            >
                                                <option value="">Select Metal</option>
                                                {changeProductAvailableMetals.map(([id, name]) => (
                                                    <option key={id} value={String(id)}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {changeProductMetalId && (
                                            <div>
                                                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Purity</label>
                                                <select
                                                    value={changeProductPurityId === '' ? '' : String(changeProductPurityId)}
                                                    onChange={(e) => {
                                                        setChangeProductPurityId(e.target.value === '' ? '' : Number(e.target.value));
                                                    }}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                                >
                                                    <option value="">Select Purity</option>
                                                    {changeProductAvailablePurities.map(([id, name]) => (
                                                        <option key={id} value={String(id)}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {changeProductPurityId && (
                                            <div>
                                                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Tone</label>
                                                <select
                                                    value={changeProductToneId === '' ? '' : String(changeProductToneId)}
                                                    onChange={(e) => {
                                                        setChangeProductToneId(e.target.value === '' ? '' : Number(e.target.value));
                                                    }}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                                >
                                                    <option value="">Select Tone</option>
                                                    {changeProductAvailableTones.map(([id, name]) => (
                                                        <option key={id} value={String(id)}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {changeProductAvailableSizes.length > 0 && changeProductToneId && (
                                            <div>
                                                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Size</label>
                                                <select
                                                    value={changeProductSize}
                                                    onChange={(e) => setChangeProductSize(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
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
                                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Quantity</label>
                                    <input
                                        type="number"
                                        value={changeProductQuantity}
                                        onChange={(e) => setChangeProductQuantity(parseInt(e.target.value) || 1)}
                                        min={1}
                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Notes (optional)</label>
                                    <textarea
                                        value={changeProductNotes}
                                        onChange={(e) => setChangeProductNotes(e.target.value)}
                                        placeholder="Add notes about this change..."
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                            <button
                                type="button"
                                onClick={closeChangeModal}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Cancel
                            </button>
                                <button
                                    type="submit"
                                    disabled={changeProductProcessing || !selectedProduct || !changeProductVariantId}
                                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 sm:text-sm"
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
                        <div className="flex-shrink-0 border-b border-slate-200 px-4 py-2.5 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Add Item</h3>
                                <button
                                    type="button"
                                    onClick={closeAddItemModal}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 sm:h-5 sm:w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                            <form onSubmit={handleAddItem} className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Search Product</label>
                            <input
                                type="text"
                                value={addItemProductSearch}
                                onChange={(e) => {
                                    setAddItemProductSearch(e.target.value);
                                    setIsManualAddItemSearch(true);
                                }}
                                placeholder="Type product name or SKU..."
                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            />
                            {addItemSearchResults.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                    {addItemSearchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => selectAddItemProduct(product)}
                                            className="w-full px-3 py-2 text-left text-xs transition hover:bg-slate-50 sm:px-4 sm:text-sm"
                                        >
                                            <div className="font-semibold text-slate-900">{product.name}</div>
                                            <div className="text-[10px] sm:text-xs text-slate-400">SKU {product.sku}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {addItemSelectedProduct && (
                            <>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Selected Product</p>
                                    <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{addItemSelectedProduct.name}</p>
                                    <p className="text-[10px] sm:text-xs text-slate-400">SKU {addItemSelectedProduct.sku}</p>
                                </div>

                                {addItemSelectedProduct.variants.length > 0 && (
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Metal</label>
                                            <select
                                                value={addItemMetalId}
                                                onChange={(e) => {
                                                    setAddItemMetalId(Number(e.target.value) || '');
                                                    setAddItemPurityId('');
                                                    setAddItemToneId('');
                                                    setAddItemSize('');
                                                }}
                                                className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
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
                                                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Purity</label>
                                                <select
                                                    value={addItemPurityId}
                                                    onChange={(e) => {
                                                        setAddItemPurityId(Number(e.target.value) || '');
                                                        setAddItemToneId('');
                                                        setAddItemSize('');
                                                    }}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
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
                                                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Tone</label>
                                                <select
                                                    value={addItemToneId}
                                                    onChange={(e) => {
                                                        setAddItemToneId(Number(e.target.value) || '');
                                                        setAddItemSize('');
                                                    }}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
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
                                                <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Size</label>
                                                <select
                                                    value={addItemSize}
                                                    onChange={(e) => setAddItemSize(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
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
                                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Quantity</label>
                                    <input
                                        type="number"
                                        value={addItemQuantity}
                                        onChange={(e) => setAddItemQuantity(parseInt(e.target.value) || 1)}
                                        min={1}
                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-slate-700">Notes (optional)</label>
                                    <textarea
                                        value={addItemNotes}
                                        onChange={(e) => setAddItemNotes(e.target.value)}
                                        placeholder="Add notes about this item..."
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                            <button
                                type="button"
                                onClick={closeAddItemModal}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Cancel
                            </button>
                                <button
                                    type="submit"
                                    disabled={addItemProcessing || !addItemSelectedProduct || !addItemVariantId}
                                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 sm:text-sm"
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
