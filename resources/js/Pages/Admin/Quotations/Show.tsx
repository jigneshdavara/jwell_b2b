import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState, useEffect, useRef, useMemo } from 'react';

type RelatedQuotation = {
    id: number;
    status: string;
    quantity: number;
    notes?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge_amount?: number | null;
        media: Array<{ url: string; alt: string }>;
        variants: Array<{
            id: number;
            label: string;
            metadata?: Record<string, unknown> | null;
            metals?: Array<{
                id: number;
                metal_id: number;
                metal_purity_id: number | null;
                metal_tone_id: number | null;
            }>;
            size?: {
                id: number;
                name: string;
                value?: string;
            } | null;
        }>;
    };
    variant?: {
        id: number;
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
    id: number;
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
        base_price?: number | null;
        making_charge_amount?: number | null;
        media: Array<{ url: string; alt: string }>;
        variants: Array<{
            id: number;
            label: string;
            metadata?: Record<string, unknown> | null;
            metals?: Array<{
                id: number;
                metal_id: number;
                metal_purity_id: number | null;
                metal_tone_id: number | null;
            }>;
            size?: {
                id: number;
                name: string;
                value?: string;
            } | null;
        }>;
    };
    variant?: {
        id: number;
        label: string;
        metadata?: Record<string, unknown> | null;
    } | null;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
    order?: {
        id: number;
        reference: string;
        status: string;
        total_amount: number;
        history: Array<{
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
    messages: Array<{
        id: number;
        sender: 'customer' | 'admin';
        message: string;
        created_at?: string | null;
        author?: string | null;
    }>;
};

type AdminQuotationShowProps = PageProps<{
    quotation: QuotationDetails;
}>;

const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    pending_customer_confirmation: 'bg-amber-100 text-amber-700',
    customer_confirmed: 'bg-emerald-100 text-emerald-700',
    customer_declined: 'bg-rose-100 text-rose-700',
};

const jobworkBadges: Record<string, string> = {
    material_sending: 'bg-slate-100 text-slate-600',
    material_received: 'bg-sky-100 text-sky-700',
    under_preparation: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    awaiting_billing: 'bg-amber-100 text-amber-700',
    billing_confirmed: 'bg-emerald-100 text-emerald-700',
    ready_to_ship: 'bg-slate-900 text-white',
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

export default function AdminQuotationShow() {
    const { quotation } = usePage<AdminQuotationShowProps>().props;
    const [changeProductModalOpen, setChangeProductModalOpen] = useState<number | null>(null);
    const [addItemModalOpen, setAddItemModalOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; sku: string }>>([]);
    const [selectedProduct, setSelectedProduct] = useState<{ 
        id: number; 
        name: string; 
        sku: string; 
        variants: Array<{ 
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
        }> 
    } | null>(null);
    const [addItemProductSearch, setAddItemProductSearch] = useState('');
    const [addItemSearchResults, setAddItemSearchResults] = useState<Array<{ id: number; name: string; sku: string }>>([]);
    const [addItemSelectedProduct, setAddItemSelectedProduct] = useState<{ 
        id: number; 
        name: string; 
        sku: string; 
        variants: Array<{ 
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
        }> 
    } | null>(null);
    const [isManualAddItemSearch, setIsManualAddItemSearch] = useState(false);
    // Track if changes have been made that require customer confirmation
    const [hasChanges, setHasChanges] = useState(quotation.status === 'pending_customer_confirmation');
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_confirmation' | ''>('');
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<RelatedQuotation | QuotationDetails | null>(null);
    const [removeItemConfirm, setRemoveItemConfirm] = useState<{ show: boolean; itemId: number | null }>({ show: false, itemId: null });

    const approveForm = useForm({
        admin_notes: quotation.admin_notes ?? '',
    });
    const rejectForm = useForm({
        admin_notes: quotation.admin_notes ?? '',
    });
    const messageForm = useForm({
        message: '',
    });
    const changeProductForm = useForm({
        product_id: '',
        product_variant_id: '',
        quantity: 1,
        admin_notes: '',
    });
    const addItemForm = useForm({
        product_id: '',
        product_variant_id: '',
        quantity: 1,
        admin_notes: '',
    });

    // Get all quotations to display (including related ones from the same submission)
    // Related quotations are those created within 5 minutes by the same user (same cart submission)
    const allQuotations = quotation.related_quotations && quotation.related_quotations.length > 0
        ? [quotation, ...quotation.related_quotations]
        : [quotation];

    // Track if user has manually typed in search (to avoid auto-search on modal open)
    const [isManualSearch, setIsManualSearch] = useState(false);

    // Search products - only when modal is open and user has typed
    useEffect(() => {
        if (!changeProductModalOpen || !isManualSearch || productSearch.length < 2) {
            if (!isManualSearch) {
                setSearchResults([]);
            }
            return;
        }

        const timeoutId = setTimeout(() => {
            // Use fetch instead of router.get to avoid navigation
            const url = new URL(route('admin.products.index'), window.location.origin);
            url.searchParams.set('search', productSearch);
            url.searchParams.set('per_page', '10');

            fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-Inertia': 'true',
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    const products = data.props?.products?.data || [];
                    setSearchResults(products.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku })));
                })
                .catch(() => {
                    setSearchResults([]);
                });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [productSearch, changeProductModalOpen, isManualSearch]);

    // Search products for add item modal
    useEffect(() => {
        if (!addItemModalOpen || !isManualAddItemSearch || addItemProductSearch.length < 2) {
            if (!isManualAddItemSearch) {
                setAddItemSearchResults([]);
            }
            return;
        }

        const timeoutId = setTimeout(() => {
            const url = new URL(route('admin.products.index'), window.location.origin);
            url.searchParams.set('search', addItemProductSearch);
            url.searchParams.set('per_page', '10');

            fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-Inertia': 'true',
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    const products = data.props?.products?.data || [];
                    setAddItemSearchResults(products.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku })));
                })
                .catch(() => {
                    setAddItemSearchResults([]);
                });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [addItemProductSearch, addItemModalOpen, isManualAddItemSearch]);

    const openChangeModal = (quotationItem: RelatedQuotation | QuotationDetails) => {
        setChangeProductModalOpen(quotationItem.id);
        setIsManualSearch(false);
        changeProductForm.setData({
            product_id: quotationItem.product.id.toString(),
            product_variant_id: quotationItem.variant?.id.toString() ?? '',
            quantity: quotationItem.quantity,
            admin_notes: '',
        });
        setProductSearch(quotationItem.product.name);
        setSelectedProduct({
            id: quotationItem.product.id,
            name: quotationItem.product.name,
            sku: quotationItem.product.sku,
            variants: quotationItem.product.variants,
        });
        setSearchResults([]);
        
        // Initialize customization state from selected variant
        if (quotationItem.variant && quotationItem.product.variants) {
            const selectedVariant = quotationItem.product.variants.find(v => v.id === quotationItem.variant?.id);
            if (selectedVariant?.metals && selectedVariant.metals.length > 0) {
                const firstMetal = selectedVariant.metals[0];
                setChangeProductMetalId(firstMetal.metal_id);
                setChangeProductPurityId(firstMetal.metal_purity_id ?? "");
                setChangeProductToneId(firstMetal.metal_tone_id ?? "");
                if (selectedVariant.size) {
                    setChangeProductSize(selectedVariant.size.value || selectedVariant.size.name);
                } else {
                    setChangeProductSize("");
                }
            } else {
                setChangeProductMetalId("");
                setChangeProductPurityId("");
                setChangeProductToneId("");
                setChangeProductSize("");
            }
        } else {
            setChangeProductMetalId("");
            setChangeProductPurityId("");
            setChangeProductToneId("");
            setChangeProductSize("");
        }
    };

    const closeChangeModal = () => {
        setChangeProductModalOpen(null);
        setProductSearch('');
        setSearchResults([]);
        setSelectedProduct(null);
        setIsManualSearch(false);
        changeProductForm.reset();
        setChangeProductMetalId("");
        setChangeProductPurityId("");
        setChangeProductToneId("");
        setChangeProductSize("");
    };

    const selectProduct = (product: { id: number; name: string; sku: string }) => {
        changeProductForm.setData('product_id', product.id.toString());
        changeProductForm.setData('product_variant_id', '');
        setProductSearch(product.name);
        
        // Try to find variants from existing quotations first
        const currentQuotation = allQuotations.find((q) => q.product.id === product.id);
        if (currentQuotation?.product.variants) {
            setSelectedProduct({
                ...product,
                variants: currentQuotation.product.variants,
            });
        } else {
            // Fetch product details with variants using edit route (which loads full product data)
            fetch(route('admin.products.edit', product.id), {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-Inertia': 'true',
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    const productData = data.props?.product;
                    if (productData?.variants) {
                        setSelectedProduct({
                            ...product,
                            variants: productData.variants.map((v: any) => ({
                                id: v.id,
                                label: v.label,
                                metadata: v.metadata ?? {},
                                size_id: v.size_id,
                                size: v.size,
                                metals: v.metals || [],
                            })),
                        });
                    } else {
                        setSelectedProduct({
                            ...product,
                            variants: [],
                        });
                    }
                })
                .catch(() => {
                    setSelectedProduct({
                        ...product,
                        variants: [],
                    });
                });
        }
        
        // Reset customization state
        setChangeProductMetalId("");
        setChangeProductPurityId("");
        setChangeProductToneId("");
        setChangeProductSize("");
    };

    // Build configuration options from variants (similar to customer panel)
    const buildConfigurationOptions = useMemo(() => {
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

    // Customization state for change product modal
    const [changeProductMetalId, setChangeProductMetalId] = useState<number | "">("");
    const [changeProductPurityId, setChangeProductPurityId] = useState<number | "">("");
    const [changeProductToneId, setChangeProductToneId] = useState<number | "">("");
    const [changeProductSize, setChangeProductSize] = useState<string>("");

    // Customization state for add item modal
    const [addItemMetalId, setAddItemMetalId] = useState<number | "">("");
    const [addItemPurityId, setAddItemPurityId] = useState<number | "">("");
    const [addItemToneId, setAddItemToneId] = useState<number | "">("");
    const [addItemSize, setAddItemSize] = useState<string>("");

    // Available options for change product modal
    const changeProductAvailableMetals = useMemo(() => {
        const map = new Map<number, string>();
        buildConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (!map.has(m.metalId)) {
                    map.set(m.metalId, m.metalName);
                }
            })
        );
        return [...map.entries()];
    }, [buildConfigurationOptions]);

    const changeProductAvailablePurities = useMemo(() => {
        if (!changeProductMetalId) return [];
        const map = new Map<number, string>();
        buildConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === changeProductMetalId && m.metalPurityId) {
                    map.set(m.metalPurityId, m.purityName);
                }
            })
        );
        return [...map.entries()];
    }, [changeProductMetalId, buildConfigurationOptions]);

    const changeProductAvailableTones = useMemo(() => {
        if (!changeProductMetalId || !changeProductPurityId) return [];
        const map = new Map<number, string>();
        buildConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === changeProductMetalId && m.metalPurityId === changeProductPurityId && m.metalToneId) {
                    map.set(m.metalToneId, m.toneName);
                }
            })
        );
        return [...map.entries()];
    }, [changeProductMetalId, changeProductPurityId, buildConfigurationOptions]);

    const changeProductAvailableSizes = useMemo(() => {
        if (!changeProductMetalId || !changeProductPurityId || !changeProductToneId) return [];
        const sizes = new Set<string>();
        buildConfigurationOptions.forEach((c) => {
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
    }, [changeProductMetalId, changeProductPurityId, changeProductToneId, buildConfigurationOptions]);

    // Auto-match variant when customization changes (change product modal)
    useEffect(() => {
        if (!changeProductMetalId || !changeProductPurityId || !changeProductToneId) {
            changeProductForm.setData('product_variant_id', '');
            return;
        }
        if (changeProductAvailableSizes.length > 0 && !changeProductSize) {
            changeProductForm.setData('product_variant_id', '');
            return;
        }

        const match = buildConfigurationOptions.find((c) => {
            const metalMatch = c.metals.some(
                (m) =>
                    m.metalId === changeProductMetalId &&
                    m.metalPurityId === changeProductPurityId &&
                    m.metalToneId === changeProductToneId
            );
            if (!metalMatch) return false;
            if (changeProductAvailableSizes.length === 0) return true;
            const s = c.size?.value || c.size?.name || "";
            return s === changeProductSize;
        });

        if (match) {
            changeProductForm.setData('product_variant_id', match.variant_id.toString());
        } else {
            changeProductForm.setData('product_variant_id', '');
        }
    }, [changeProductMetalId, changeProductPurityId, changeProductToneId, changeProductSize, buildConfigurationOptions, changeProductAvailableSizes.length]);

    // Available options for add item modal
    const addItemBuildConfigurationOptions = useMemo(() => {
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

    const addItemAvailableMetals = useMemo(() => {
        const map = new Map<number, string>();
        addItemBuildConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (!map.has(m.metalId)) {
                    map.set(m.metalId, m.metalName);
                }
            })
        );
        return [...map.entries()];
    }, [addItemBuildConfigurationOptions]);

    const addItemAvailablePurities = useMemo(() => {
        if (!addItemMetalId) return [];
        const map = new Map<number, string>();
        addItemBuildConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === addItemMetalId && m.metalPurityId) {
                    map.set(m.metalPurityId, m.purityName);
                }
            })
        );
        return [...map.entries()];
    }, [addItemMetalId, addItemBuildConfigurationOptions]);

    const addItemAvailableTones = useMemo(() => {
        if (!addItemMetalId || !addItemPurityId) return [];
        const map = new Map<number, string>();
        addItemBuildConfigurationOptions.forEach((c) =>
            c.metals.forEach((m) => {
                if (m.metalId === addItemMetalId && m.metalPurityId === addItemPurityId && m.metalToneId) {
                    map.set(m.metalToneId, m.toneName);
                }
            })
        );
        return [...map.entries()];
    }, [addItemMetalId, addItemPurityId, addItemBuildConfigurationOptions]);

    const addItemAvailableSizes = useMemo(() => {
        if (!addItemMetalId || !addItemPurityId || !addItemToneId) return [];
        const sizes = new Set<string>();
        addItemBuildConfigurationOptions.forEach((c) => {
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
    }, [addItemMetalId, addItemPurityId, addItemToneId, addItemBuildConfigurationOptions]);

    // Auto-match variant when customization changes (add item modal)
    useEffect(() => {
        if (!addItemMetalId || !addItemPurityId || !addItemToneId) {
            addItemForm.setData('product_variant_id', '');
            return;
        }
        if (addItemAvailableSizes.length > 0 && !addItemSize) {
            addItemForm.setData('product_variant_id', '');
            return;
        }

        const match = addItemBuildConfigurationOptions.find((c) => {
            const metalMatch = c.metals.some(
                (m) =>
                    m.metalId === addItemMetalId &&
                    m.metalPurityId === addItemPurityId &&
                    m.metalToneId === addItemToneId
            );
            if (!metalMatch) return false;
            if (addItemAvailableSizes.length === 0) return true;
            const s = c.size?.value || c.size?.name || "";
            return s === addItemSize;
        });

        if (match) {
            addItemForm.setData('product_variant_id', match.variant_id.toString());
        } else {
            addItemForm.setData('product_variant_id', '');
        }
    }, [addItemMetalId, addItemPurityId, addItemToneId, addItemSize, addItemBuildConfigurationOptions, addItemAvailableSizes.length]);

    const submitChangeProduct = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!changeProductModalOpen) return;

        changeProductForm.post(route('admin.quotations.update-product', changeProductModalOpen), {
            preserveScroll: true,
            onSuccess: () => {
                setHasChanges(true);
                setActionType('request_confirmation'); // Auto-select request confirmation when changes are made
                closeChangeModal();
            },
        });
    };

    const openAddItemModal = () => {
        setAddItemModalOpen(true);
        setIsManualAddItemSearch(false);
        addItemForm.setData({
            product_id: '',
            product_variant_id: '',
            quantity: 1,
            admin_notes: '',
        });
        setAddItemProductSearch('');
        setAddItemSelectedProduct(null);
        setAddItemSearchResults([]);
    };

    const closeAddItemModal = () => {
        setAddItemModalOpen(false);
        setAddItemProductSearch('');
        setAddItemSearchResults([]);
        setAddItemSelectedProduct(null);
        setIsManualAddItemSearch(false);
        addItemForm.reset();
        setAddItemMetalId("");
        setAddItemPurityId("");
        setAddItemToneId("");
        setAddItemSize("");
    };

    const selectAddItemProduct = (product: { id: number; name: string; sku: string }) => {
        addItemForm.setData('product_id', product.id.toString());
        addItemForm.setData('product_variant_id', '');
        setAddItemProductSearch(product.name);
        
        const currentQuotation = allQuotations.find((q) => q.product.id === product.id);
        if (currentQuotation?.product.variants) {
            setAddItemSelectedProduct({
                ...product,
                variants: currentQuotation.product.variants,
            });
        } else {
            // Fetch product details with variants using edit route (which loads full product data)
            fetch(route('admin.products.edit', product.id), {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                    'X-Inertia': 'true',
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    const productData = data.props?.product;
                    if (productData?.variants) {
                        setAddItemSelectedProduct({
                            ...product,
                            variants: productData.variants.map((v: any) => ({
                                id: v.id,
                                label: v.label,
                                metadata: v.metadata ?? {},
                                size_id: v.size_id,
                                size: v.size,
                                metals: v.metals || [],
                            })),
                        });
                    } else {
                        setAddItemSelectedProduct({
                            ...product,
                            variants: [],
                        });
                    }
                })
                .catch(() => {
                    setAddItemSelectedProduct({
                        ...product,
                        variants: [],
                    });
                });
        }
        
        // Reset customization state
        setAddItemMetalId("");
        setAddItemPurityId("");
        setAddItemToneId("");
        setAddItemSize("");
    };

    const submitAddItem = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        addItemForm.post(route('admin.quotations.add-item', quotation.id), {
            preserveScroll: true,
            onSuccess: () => {
                setHasChanges(true);
                setActionType('request_confirmation');
                closeAddItemModal();
            },
        });
    };

    const submitMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!messageForm.data.message.trim()) {
            return;
        }

        messageForm.post(route('admin.quotations.messages.store', quotation.id), {
            preserveScroll: true,
            onSuccess: () => messageForm.reset('message'),
        });
    };

    return (
        <AdminLayout>
            <Head title={`Quotation #${quotation.id}`} />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-slate-900">Quotation #{quotation.id}</h1>
                        <Link
                            href={route('admin.quotations.index')}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Invoice Header */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="grid gap-8 md:grid-cols-3">
                            {/* Company Details */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">From</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">Elvee</p>
                                <p className="mt-1 text-sm text-slate-600">123 Business Street</p>
                                <p className="text-sm text-slate-600">Mumbai, Maharashtra 400001</p>
                                <p className="mt-2 text-sm text-slate-600">Phone: +91 98765 43210</p>
                                <p className="text-sm text-slate-600">Email: info@elvee.com</p>
                                <p className="mt-2 text-sm text-slate-600">GSTIN: 27AAAAA0000A1Z5</p>
                            </div>
                            {/* Bill To */}
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bill To</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">{quotation.user?.name ?? 'Unknown'}</p>
                                <p className="mt-1 text-sm text-slate-600">{quotation.user?.email ?? '—'}</p>
                            </div>
                            {/* Quotation Details */}
                            <div className="text-right">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Quotation Details</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">#{quotation.id}</p>
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
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {item.product.media?.[0] && (
                                                            <img
                                                                src={item.product.media[0].url}
                                                                alt={item.product.media[0].alt}
                                                                className="h-12 w-12 rounded-lg object-cover shadow-sm"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                                                            <p className="text-xs text-slate-400">SKU {item.product.sku}</p>
                                                            {item.variant && (
                                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                                    {(item.variant.metadata?.auto_label as string) || item.variant.label}
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
                                        const totals = allQuotations.reduce((acc, item) => {
                                            const priceBreakdown = item.price_breakdown || {};
                                            const metalCost = Number(priceBreakdown.metal) || 0;
                                            const diamondCost = Number(priceBreakdown.diamond) || 0;
                                            const makingCharge = Number(priceBreakdown.making) || 0;
                                            const unitTotal = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                            const quantity = Number(item.quantity) || 0;
                                            const lineTotal = unitTotal * quantity;
                                            
                                            acc.totalBase += lineTotal;
                                            
                                            return acc;
                                        }, { totalBase: 0 });
                                        
                                        // Use backend-calculated tax summary if available, otherwise calculate from totals
                                        const taxSummary = quotation.tax_summary;
                                        const subtotal = taxSummary ? taxSummary.subtotal : totals.totalBase;
                                        const tax = taxSummary ? taxSummary.tax : 0;
                                        const grandTotal = taxSummary ? taxSummary.total : (subtotal + tax);
                                        const taxRate = quotation.tax_rate ?? 18;
                                        
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

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-6">
                            {quotation.order && (
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="text-lg font-semibold text-slate-900">Linked Order</h2>
                                <div className="mt-4 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Order Reference</p>
                                            <Link
                                                href={route('admin.orders.show', quotation.order.id)}
                                                className="mt-1 text-base font-semibold text-sky-600 hover:text-sky-500"
                                            >
                                                {quotation.order.reference}
                                            </Link>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
                                            <p className="mt-1 text-base font-semibold text-slate-900">{quotation.order.status.replace(/_/g, ' ')}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Amount</p>
                                            <p className="mt-1 text-xl font-semibold text-slate-900">₹ {quotation.order.total_amount.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                    {quotation.order?.history?.length ? (
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
                                    ) : null}
                                </div>
                            </div>
                        )}

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

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
                            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2 text-sm text-slate-600">
                                {quotation.messages.length === 0 && (
                                    <p className="text-xs text-slate-400">No messages yet. Start by sending the customer a note below.</p>
                                )}
                                {quotation.messages.map((message) => (
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
                            <form onSubmit={submitMessage} className="mt-4 space-y-3 text-sm text-slate-600">
                                <label className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold text-slate-800">Send Message</span>
                                    <textarea
                                        value={messageForm.data.message}
                                        onChange={(event) => messageForm.setData('message', event.target.value)}
                                        className="min-h-[100px] rounded-2xl border border-slate-200 px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Request more information or share updates with the client..."
                                        disabled={messageForm.processing}
                                    />
                                </label>
                                {messageForm.errors.message && (
                                    <p className="text-xs text-rose-500">{messageForm.errors.message}</p>
                                )}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={messageForm.processing || !messageForm.data.message.trim()}
                                        className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {messageForm.processing ? 'Sending…' : 'Send message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        </div>

                        <aside className="space-y-6">
                            {quotation.admin_notes && (
                                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                    <h2 className="text-lg font-semibold text-slate-900">Admin Notes</h2>
                                    <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{quotation.admin_notes}</p>
                                </div>
                            )}

                            {/* Combined Action Form */}
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="mb-4 text-lg font-semibold text-slate-900">Actions</h2>
                                
                                {hasChanges && (
                                    <div className="mb-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-3">
                                        <p className="text-sm font-semibold text-amber-800">Changes detected</p>
                                        <p className="mt-1 text-xs text-amber-700">Product or quantity has been modified. Request customer confirmation to save changes.</p>
                                    </div>
                                )}

                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        if (!actionType) return;
                                        
                                        const formData = new FormData(event.currentTarget as HTMLFormElement);
                                        const notes = formData.get('notes') as string;

                                        if (actionType === 'approve') {
                                            approveForm.setData('admin_notes', notes);
                                            approveForm.post(route('admin.quotations.approve', quotation.id), {
                                                preserveScroll: true,
                                            });
                                        } else if (actionType === 'reject') {
                                            rejectForm.setData('admin_notes', notes);
                                            rejectForm.post(route('admin.quotations.reject', quotation.id), {
                                                preserveScroll: true,
                                            });
                                        } else if (actionType === 'request_confirmation') {
                                            router.post(route('admin.quotations.request-confirmation', quotation.id), {
                                                notes: notes,
                                            }, {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setHasChanges(false);
                                                    setActionType('');
                                                },
                                            });
                                        }
                                    }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Action</label>
                                        <select
                                            name="action"
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
                                            name="notes"
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
                                        disabled={!actionType}
                                        className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 ${
                                            actionType === 'approve' ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500' :
                                            actionType === 'reject' ? 'bg-rose-600 shadow-rose-600/30 hover:bg-rose-500' :
                                            hasChanges ? 'bg-amber-600 shadow-amber-600/30 hover:bg-amber-500' :
                                            'bg-sky-600 shadow-sky-600/30 hover:bg-sky-500'
                                        }`}
                                    >
                                        {actionType === 'approve' ? 'Approve Quotation' :
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

            {/* Product Details Modal */}
            {productDetailsModalOpen && (
                <Modal show={true} onClose={() => setProductDetailsModalOpen(null)} maxWidth="4xl">
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
                                            src={productDetailsModalOpen.product.media[0].url}
                                            alt={productDetailsModalOpen.product.media[0].alt}
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
                                        <p className="text-sm text-slate-700 whitespace-pre-line">{productDetailsModalOpen.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Change Product Modal */}
            <Modal show={changeProductModalOpen !== null} onClose={closeChangeModal} maxWidth="4xl">
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
                        <form onSubmit={submitChangeProduct} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Search Product</label>
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setIsManualSearch(true); // Mark as manual search
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
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition"
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
                                                        setChangeProductMetalId(Number(e.target.value) || "");
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
                                                            setChangeProductPurityId(Number(e.target.value) || "");
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
                                                            setChangeProductToneId(Number(e.target.value) || "");
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
                                            value={changeProductForm.data.quantity}
                                            onChange={(e) => changeProductForm.setData('quantity', parseInt(e.target.value) || 1)}
                                            min={1}
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Notes (optional)</label>
                                        <textarea
                                            value={changeProductForm.data.admin_notes}
                                            onChange={(e) => changeProductForm.setData('admin_notes', e.target.value)}
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
                                    disabled={changeProductForm.processing || !selectedProduct}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {changeProductForm.processing ? 'Updating...' : 'Update Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <Modal show={addItemModalOpen} onClose={closeAddItemModal} maxWidth="4xl">
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
                        <form onSubmit={submitAddItem} className="space-y-4">
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
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition"
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
                                                        setAddItemMetalId(Number(e.target.value) || "");
                                                        setAddItemPurityId("");
                                                        setAddItemToneId("");
                                                        setAddItemSize("");
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
                                                            setAddItemPurityId(Number(e.target.value) || "");
                                                            setAddItemToneId("");
                                                            setAddItemSize("");
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
                                                            setAddItemToneId(Number(e.target.value) || "");
                                                            setAddItemSize("");
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
                                            value={addItemForm.data.quantity}
                                            onChange={(e) => addItemForm.setData('quantity', parseInt(e.target.value) || 1)}
                                            min={1}
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Notes (optional)</label>
                                        <textarea
                                            value={addItemForm.data.admin_notes}
                                            onChange={(e) => addItemForm.setData('admin_notes', e.target.value)}
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
                                    disabled={addItemForm.processing || !addItemSelectedProduct}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {addItemForm.processing ? 'Adding...' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                show={removeItemConfirm.show && removeItemConfirm.itemId !== null}
                onClose={() => setRemoveItemConfirm({ show: false, itemId: null })}
                onConfirm={() => {
                    if (removeItemConfirm.itemId) {
                        router.delete(route('admin.quotations.destroy', removeItemConfirm.itemId), {
                            preserveScroll: true,
                            onSuccess: () => {
                                setHasChanges(true);
                                setActionType('request_confirmation');
                                setRemoveItemConfirm({ show: false, itemId: null });
                            },
                        });
                    }
                }}
                title="Remove Item"
                message="Are you sure you want to remove this item from the quotation?"
                confirmText="Remove"
                variant="danger"
            />
        </AdminLayout>
    );
}

