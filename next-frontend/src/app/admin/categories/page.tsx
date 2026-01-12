"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import TextInput from "@/components/ui/TextInput";
import InputLabel from "@/components/ui/InputLabel";
import InputError from "@/components/ui/InputError";
import Checkbox from "@/components/ui/Checkbox";
import { Menu, Transition } from "@headlessui/react";
import React from "react";
import { adminService } from "@/services/adminService";
import { PaginationMeta, generatePaginationLinks } from "@/utils/pagination";
import { toastError } from "@/utils/toast";
import { getMediaUrlNullable } from "@/utils/mediaUrl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, CategoryFormData } from "@/lib/validation/admin.schema";

type CategoryRow = {
    id: number;
    parent_id: number | null;
    parent: { id: number; name: string } | null;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
    cover_image_url?: string | null;
    styles?: Array<{ id: number; name: string }>;
    sizes?: Array<{ id: number; name: string }>;
};

type CategoryTreeNode = {
    id: number;
    name: string;
    parent_id: number | null;
    children: CategoryTreeNode[];
};

type Style = {
    id: number;
    name: string;
};

type Size = {
    id: number;
    name: string;
};


export default function AdminCategoriesPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ data: CategoryRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [fullCategoryTree, setFullCategoryTree] = useState<CategoryTreeNode[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState<CategoryRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    // React Hook Form setup
    const {
        control,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        reset,
        setError,
        setValue,
        trigger,
        watch,
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        mode: "onSubmit",
        reValidateMode: "onBlur",
        shouldFocusError: true,
        defaultValues: {
            parent_id: '',
            code: '',
            name: '',
            description: '',
            is_active: true,
            display_order: 0,
            style_ids: [],
            size_ids: [],
        },
    });

    const [styles, setStyles] = useState<Style[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
    const [removeCoverImage, setRemoveCoverImage] = useState(false);
    const [styleSearchQuery, setStyleSearchQuery] = useState('');
    const [sizeSearchQuery, setSizeSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const [stylesAssignedToProducts, setStylesAssignedToProducts] = useState<Set<number>>(new Set());
    const [sizesAssignedToProducts, setSizesAssignedToProducts] = useState<Set<number>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        loadCategories();
        loadStyles();
        loadSizes();
    }, [currentPage, perPage]);

    const loadStyles = async () => {
        try {
            // Pass active_only=true to filter out paused styles for category form
            const response = await adminService.getStyles(1, 1000, true); // Load all active styles only
            const items = response.data.items || response.data.data || [];
            setStyles(items.map((item: any) => ({ id: Number(item.id), name: item.name })));
        } catch (error: any) {
        }
    };

    const loadSizes = async () => {
        try {
            // Pass active_only=true to filter out paused sizes for category form
            const response = await adminService.getSizes(1, 1000, true); // Load all active sizes only
            const items = response.data.items || response.data.data || [];
            setSizes(items.map((item: any) => ({ id: Number(item.id), name: item.name })));
        } catch (error: any) {
        }
    };

    // Convert backend tree format to frontend format
    const convertTree = (nodes: any[]): CategoryTreeNode[] => {
        return nodes.map((node: any) => ({
            id: Number(node.id),
            name: node.name,
            parent_id: node.parent_id ? Number(node.parent_id) : null,
            children: node.children ? convertTree(node.children) : [],
        }));
    };

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await adminService.getCategories(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            // Store full category tree from API (contains all categories, not just paginated)
            if (response.data.categoryTree) {
                setFullCategoryTree(convertTree(response.data.categoryTree));
            }

            setData({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    parent_id: item.parent_id ? Number(item.parent_id) : null,
                    parent: item.parent ? { id: Number(item.parent.id), name: item.parent.name } : null,
                    code: item.code,
                    name: item.name,
                    description: item.description,
                    is_active: item.is_active,
                    display_order: item.display_order || 0,
                    cover_image_url: item.cover_image_url ? getMediaUrlNullable(item.cover_image_url) : null,
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || currentPage,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                    from: responseMeta.from,
                    to: responseMeta.to,
                    links: responseMeta.links || generatePaginationLinks(responseMeta.current_page || responseMeta.page || currentPage, responseMeta.last_page || responseMeta.lastPage || 1),
                },
            });
        } catch (error: any) {
        } finally {
            setLoading(false);
        }
    };

    const allSelected = useMemo(() => {
        if (data.data.length === 0) return false;
        return selectedCategories.length === data.data.length;
    }, [data.data, selectedCategories]);

    const toggleSelectAll = () => {
        setSelectedCategories(allSelected ? [] : data.data.map(c => c.id));
    };

    const toggleSelection = (id: number) => {
        setSelectedCategories(prev => prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]);
    };

    // Use full category tree from API (contains all categories)
    // Fallback to building from paginated data if API tree not available
    const categoryTree = useMemo(() => {
        if (fullCategoryTree.length > 0) {
            return fullCategoryTree;
        }
        // Fallback: build tree from paginated data (only shows categories on current page)
        const buildTree = (categories: CategoryRow[], parentId: number | null = null): CategoryTreeNode[] => {
            return categories
                .filter(cat => cat.parent_id === parentId)
                .map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    parent_id: cat.parent_id,
                    children: buildTree(categories, cat.id),
                }));
        };
        return buildTree(data.data);
    }, [fullCategoryTree, data.data]);

    // Filter tree to exclude editing category and its descendants
    const availableCategoryTree = useMemo(() => {
        if (!editingCategory) {
            return categoryTree;
        }
        const getDescendantIds = (node: CategoryTreeNode): number[] => {
            const ids = [node.id];
            node.children.forEach(child => {
                ids.push(...getDescendantIds(child));
            });
            return ids;
        };
        const findNode = (tree: CategoryTreeNode[], id: number): CategoryTreeNode | null => {
            for (const node of tree) {
                if (node.id === id) return node;
                const found = findNode(node.children, id);
                if (found) return found;
            }
            return null;
        };
        const editingNode = findNode(categoryTree, editingCategory.id);
        const excludeIds = editingNode ? [editingCategory.id, ...getDescendantIds(editingNode)] : [editingCategory.id];
        const filterTree = (tree: CategoryTreeNode[], excludeIds: number[]): CategoryTreeNode[] => {
            return tree
                .filter((node) => !excludeIds.includes(node.id))
                .map((node) => ({
                    ...node,
                    children: filterTree(node.children, excludeIds),
                }));
        };
        return filterTree(categoryTree, excludeIds);
    }, [categoryTree, editingCategory]);

    // Get selected category name
    const getSelectedCategoryName = (): string => {
        const parentId = watch('parent_id');
        if (parentId === '' || !parentId) {
            return 'None (Top Level)';
        }
        const findCategoryName = (tree: CategoryTreeNode[], id: string | number): string | null => {
            for (const node of tree) {
                if (String(node.id) === String(id)) {
                    return node.name;
                }
                const found = findCategoryName(node.children, id);
                if (found) return found;
            }
            return null;
        };
        return findCategoryName(availableCategoryTree, parentId) || 'Select parent category';
    };

    // Toggle node expansion
    const toggleNode = (nodeId: number) => {
        setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

    // Render tree node recursively
    const renderTreeNode = useCallback((node: CategoryTreeNode, level: number = 0, closeMenu?: () => void): React.ReactNode => {
        const parentId = watch('parent_id');
        const isSelected = String(parentId) === String(node.id);
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);

        return (
            <div key={node.id} className="relative">
                <Menu.Item>
                    {({ active, close }) => (
                        <div
                            className={`flex items-center gap-1 rounded-lg transition-colors pl-2 sm:pl-3 ${
                                isSelected
                                    ? 'bg-sky-50 text-sky-700'
                                    : active
                                    ? 'bg-slate-50 text-slate-700'
                                    : 'text-slate-700'
                            }`}
                        >
                            <div className="flex items-center" style={{ width: `${level * 16}px` }}>
                                {level > 0 && (
                                    <div className="w-px h-5 sm:h-6 bg-slate-200 mr-1.5 sm:mr-2"></div>
                                )}
                            </div>

                            {hasChildren ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleNode(node.id);
                                    }}
                                    className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded hover:bg-slate-200 transition-colors flex-shrink-0"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"></div>
                            )}
                            <div
                                className={`flex-1 py-1.5 sm:py-2 cursor-pointer rounded ${
                                    isSelected ? 'font-medium' : ''
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setValue('parent_id', String(node.id));
                                    trigger('parent_id');
                                    close();
                                    closeMenu?.();
                                }}
                            >
                                <span className="text-xs sm:text-sm">{node.name}</span>
                            </div>
                        </div>
                    )}
                </Menu.Item>

                {hasChildren && isExpanded && (
                    <div className="relative">
                        {node.children.map((child) => renderTreeNode(child, level + 1, closeMenu))}
                    </div>
                )}
            </div>
        );
    }, [watch('parent_id'), expandedNodes]);

    const resetForm = () => {
        setEditingCategory(null);
        setModalOpen(false);
        setExpandedNodes(new Set());
        setStylesAssignedToProducts(new Set());
        setSizesAssignedToProducts(new Set());
        reset({
            parent_id: '',
            code: '',
            name: '',
            description: '',
            is_active: true,
            display_order: 0,
            style_ids: [],
            size_ids: [],
        });
        setStyleSearchQuery('');
        setSizeSearchQuery('');
        setCoverPreview(null);
        setRemoveCoverImage(false);
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const expandPathToCategory = (categoryId: number | null, tree: CategoryTreeNode[]): void => {
        if (!categoryId) return;
        const nodesToExpand = new Set<number>();
        const findAndExpand = (nodes: CategoryTreeNode[], targetId: number, path: number[] = []): boolean => {
            for (const node of nodes) {
                const currentPath = [...path, node.id];
                if (node.id === targetId) {
                    currentPath.forEach((id) => nodesToExpand.add(id));
                    return true;
                }
                if (node.children.length > 0) {
                    if (findAndExpand(node.children, targetId, currentPath)) {
                        nodesToExpand.add(node.id);
                        return true;
                    }
                }
            }
            return false;
        };
        findAndExpand(tree, categoryId);
        if (nodesToExpand.size > 0) {
            setExpandedNodes((prev) => {
                const newSet = new Set(prev);
                nodesToExpand.forEach((id) => newSet.add(id));
                return newSet;
            });
        }
    };

    const openEditModal = async (category: CategoryRow) => {
        try {
            // Fetch full category details with styles and sizes
            const response = await adminService.getCategory(category.id);
            const fullCategory = response.data;
            
            // Store styles assigned to products
            const assignedStyleIds = fullCategory.styles_assigned_to_products || [];
            setStylesAssignedToProducts(new Set(assignedStyleIds.map((id: any) => Number(id))));
            
            // Store sizes assigned to products
            const assignedSizeIds = fullCategory.sizes_assigned_to_products || [];
            setSizesAssignedToProducts(new Set(assignedSizeIds.map((id: any) => Number(id))));
            
            setEditingCategory({
                ...category,
                styles: fullCategory.styles || [],
                sizes: fullCategory.sizes || [],
                cover_image_url: fullCategory.cover_image_url ? getMediaUrlNullable(fullCategory.cover_image_url) : null,
            });
            reset({
                parent_id: fullCategory.parent_id ? String(fullCategory.parent_id) : '',
                code: fullCategory.code ?? '',
                name: fullCategory.name,
                description: fullCategory.description ?? '',
                is_active: fullCategory.is_active,
                display_order: fullCategory.display_order,
                style_ids: fullCategory.styles?.map((s: any) => Number(s.id)) ?? [],
                size_ids: fullCategory.sizes?.map((s: any) => Number(s.id)) ?? [],
            });
            setCoverPreview(fullCategory.cover_image_url ? getMediaUrlNullable(fullCategory.cover_image_url) : null);
            setRemoveCoverImage(false);
            if (coverObjectUrl) {
                URL.revokeObjectURL(coverObjectUrl);
                setCoverObjectUrl(null);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
            setModalOpen(true);
            if (fullCategory.parent_id && categoryTree.length > 0) {
                expandPathToCategory(Number(fullCategory.parent_id), categoryTree);
            }
        } catch (error: any) {
            // Fallback to basic category data
            setStylesAssignedToProducts(new Set());
            setSizesAssignedToProducts(new Set());
            setEditingCategory(category);
            reset({
                parent_id: category.parent_id ? String(category.parent_id) : '',
                code: category.code ?? '',
                name: category.name,
                description: category.description ?? '',
                is_active: category.is_active,
                display_order: category.display_order,
                style_ids: [],
                size_ids: [],
            });
            setCoverPreview(category.cover_image_url ? getMediaUrlNullable(category.cover_image_url) : null);
            setRemoveCoverImage(false);
            if (coverObjectUrl) {
                URL.revokeObjectURL(coverObjectUrl);
                setCoverObjectUrl(null);
            }
            setModalOpen(true);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setRemoveCoverImage(false);

        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setCoverPreview(objectUrl);
            setCoverObjectUrl(objectUrl);
        } else {
            setCoverPreview(editingCategory?.cover_image_url ? getMediaUrlNullable(editingCategory.cover_image_url) : null);
        }
    };

    const removeCoverImageHandler = () => {
        setRemoveCoverImage(true);
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        setCoverPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        return () => {
            if (coverObjectUrl) {
                URL.revokeObjectURL(coverObjectUrl);
            }
        };
    }, [coverObjectUrl]);

    const onSubmit = async (data: CategoryFormData) => {
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', data.name);
            if (data.code) formData.append('code', data.code);
            if (data.description) formData.append('description', data.description);
            if (data.parent_id && data.parent_id !== '') formData.append('parent_id', String(data.parent_id));
            formData.append('is_active', String(data.is_active));
            formData.append('display_order', String(data.display_order));
            
            // Append arrays - NestJS expects arrays as multiple entries with same key
            data.style_ids.forEach(id => formData.append('style_ids', String(id)));
            data.size_ids.forEach(id => formData.append('size_ids', String(id)));
            
            const coverFile = fileInputRef.current?.files?.[0];
            if (coverFile) {
                formData.append('cover_image', coverFile);
            } else if (removeCoverImage) {
                formData.append('remove_cover_image', 'true');
            }

            if (editingCategory) {
                await adminService.updateCategory(editingCategory.id, formData);
            } else {
                await adminService.createCategory(formData);
            }
            resetForm();
            await loadCategories();
        } catch (error: any) {
            // Handle field-level errors
            if (error.response?.data?.errors) {
                const fieldErrors = error.response.data.errors;
                Object.keys(fieldErrors).forEach((key) => {
                    const errorMessage = Array.isArray(fieldErrors[key]) 
                        ? fieldErrors[key][0] 
                        : fieldErrors[key];
                    setError(key as keyof CategoryFormData, {
                        type: 'server',
                        message: errorMessage,
                    });
                });
            }
            
            // Show error message in FlashMessage (prioritize message field)
            const errorMessage = error.response?.data?.message 
                ? (Array.isArray(error.response.data.message) 
                    ? error.response.data.message.join(', ') 
                    : error.response.data.message)
                : 'Failed to save category. Please try again.';
            toastError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const toggleActivation = async (category: CategoryRow) => {
        try {
            const formData = new FormData();
            formData.append('name', category.name);
            if (category.code) formData.append('code', category.code);
            if (category.description) formData.append('description', category.description || '');
            if (category.parent_id) formData.append('parent_id', String(category.parent_id));
            formData.append('is_active', String(!category.is_active));
            formData.append('display_order', String(category.display_order));
            await adminService.updateCategory(category.id, formData);
            await loadCategories();
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to update category. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteCategory(deleteConfirm.id);
                await loadCategories();
            } catch (error: any) {
                toastError(error.response?.data?.message || 'Failed to delete category. Please try again.');
            } finally {
                setDeleteConfirm(null);
            }
        }
    };

    if (loading && !data.data.length) return null;

    return (
        <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Categories</h1>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500">Manage product categories for catalogue organization.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New category
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm">
                    <div className="font-semibold text-slate-700">Categories ({data.meta.total})</div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                        <span>{selectedCategories.length} selected</span>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedCategories.length === 0}
                            className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                        >
                            Bulk delete
                        </button>
                        <select value={perPage} onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs focus:ring-0 sm:px-3">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                        <tr>
                                <th className="px-3 py-2 sm:px-5 sm:py-3">
                                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold" />
                            </th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Code</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Name</th>
                                <th className="px-3 py-2 text-left hidden md:table-cell sm:px-5 sm:py-3">Parent</th>
                                <th className="px-3 py-2 text-left hidden lg:table-cell sm:px-5 sm:py-3">Order</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Status</th>
                                <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {data.data.map((category) => (
                            <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => toggleSelection(category.id)} className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold" />
                                </td>
                                    <td className="px-3 py-2 text-slate-700 sm:px-5 sm:py-3">{category.code || '-'}</td>
                                    <td className="px-3 py-2 font-semibold text-slate-900 sm:px-5 sm:py-3">
                                    <div className="flex flex-col gap-1">
                                            <span className="text-xs sm:text-sm">{category.name}</span>
                                            {category.description && <span className="text-[10px] sm:text-xs text-slate-500 font-normal">{category.description}</span>}
                                    </div>
                                </td>
                                    <td className="px-3 py-2 text-slate-500 hidden md:table-cell sm:px-5 sm:py-3">{category.parent?.name ?? '—'}</td>
                                    <td className="px-3 py-2 text-slate-500 hidden lg:table-cell sm:px-5 sm:py-3">{category.display_order}</td>
                                    <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs font-semibold ${category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {category.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                    <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                        <div className="flex justify-end gap-1.5 sm:gap-2">
                                            <button onClick={() => openEditModal(category)} className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"><svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M16.862 4.487l1.687-1.688a1.875 1.125 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                            <button onClick={() => toggleActivation(category)} className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600">
                                                {category.is_active ? <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M15.75 5.25v13.5m-7.5-13.5v13.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </button>
                                            <button onClick={() => setDeleteConfirm(category)} className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"><svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M14.74 9l-.34 9m-4.74-9l.34 9m9.96-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            <Pagination 
                meta={data.meta} 
                onPageChange={setCurrentPage} 
            />

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-slate-900 truncate">{editingCategory ? `Edit category: ${editingCategory.name}` : 'Create new category'}</h2>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <button onClick={resetForm} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">Cancel</button>
                                <button type="submit" form="category-form" disabled={loading} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{editingCategory ? 'Update' : 'Create'}</button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                    aria-label="Close modal"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
                        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4 sm:space-y-6" id="category-form">
                            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid gap-3 sm:gap-4">
                                        {/* Parent Category */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="parent_id">Parent Category</InputLabel>
                                            <Controller
                                                name="parent_id"
                                                control={control}
                                                render={({ field, fieldState }) => {
                                                    const parentId = field.value || '';
                                                    return (
                                                        <>
                                                            <Menu as="div" className="relative">
                                                                <Menu.Button className={`w-full min-h-[44px] rounded-lg sm:rounded-xl border ${fieldState.error ? 'border-red-300' : 'border-slate-300'} bg-white text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-left text-xs sm:text-sm`}>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={parentId === '' ? 'text-slate-500' : 'text-slate-900'}>
                                                                            {getSelectedCategoryName()}
                                                                        </span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </Menu.Button>
                                                                <Transition
                                                                    enter="transition ease-out duration-100"
                                                                    enterFrom="transform opacity-0 scale-95"
                                                                    enterTo="transform opacity-100 scale-100"
                                                                    leave="transition ease-in duration-75"
                                                                    leaveFrom="transform opacity-100 scale-100"
                                                                    leaveTo="transform opacity-0 scale-95"
                                                                >
                                                                    <Menu.Items className="absolute z-50 mt-2 w-full max-h-80 overflow-y-auto rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                        <div className="p-2">
                                                                            <Menu.Item>
                                                                                {({ active, close }) => (
                                                                                    <div
                                                                                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 cursor-pointer transition-colors ${
                                                                                            parentId === ''
                                                                                                ? 'bg-sky-50 text-sky-700 font-medium'
                                                                                                : active
                                                                                                ? 'bg-slate-50 text-slate-700'
                                                                                                : 'text-slate-700'
                                                                                        }`}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (parentId !== '') {
                                                                                                field.onChange('');
                                                                                                trigger('parent_id');
                                                                                                close();
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        <div className="w-4 h-4 sm:w-5 sm:h-5"></div>
                                                                                        <span className="text-xs sm:text-sm">None (Top Level)</span>
                                                                                    </div>
                                                                                )}
                                                                            </Menu.Item>
                                                                            <div className="mt-1 space-y-0.5">
                                                                                {availableCategoryTree.map((node) => renderTreeNode(node, 0))}
                                                                            </div>
                                                                        </div>
                                                                    </Menu.Items>
                                                                </Transition>
                                                            </Menu>
                                                            {fieldState.error && <InputError message={fieldState.error.message} />}
                                                        </>
                                                    );
                                                }}
                                            />
                                        </div>

                                        {/* Code */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="code">Code</InputLabel>
                                            <Controller
                                                name="code"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="code"
                                                            type="text"
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                trigger('code');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('code');
                                                            }}
                                                            placeholder="e.g., RNG, NKL"
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>

                                        {/* Name */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="name">Name</InputLabel>
                                            <Controller
                                                name="name"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="name"
                                                            type="text"
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                trigger('name');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('name');
                                                            }}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>

                                        {/* Display Order */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="display_order">Display order</InputLabel>
                                            <Controller
                                                name="display_order"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="display_order"
                                                            type="number"
                                                            value={field.value?.toString() || '0'}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                field.onChange(value);
                                                                trigger('display_order');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('display_order');
                                                            }}
                                                            onFocus={(e) => {
                                                                if (e.target.value === '0') {
                                                                    e.target.select();
                                                                }
                                                            }}
                                                            min={0}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        <label className="flex flex-col gap-3 text-xs sm:text-sm text-slate-600">
                                            <span>Cover Image</span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleCoverChange}
                                                className="w-full cursor-pointer rounded-xl sm:rounded-2xl border border-dashed border-slate-300 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 sm:file:px-4 sm:file:py-2 file:text-xs sm:file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                                            />
                                            {coverPreview && coverObjectUrl && (
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4">
                                                    <img
                                                        src={coverPreview}
                                                        alt="Cover preview"
                                                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg sm:rounded-xl object-cover ring-1 ring-slate-200"
                                                    />
                                                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                                                        <span className="text-xs text-slate-500">
                                                            {editingCategory
                                                                ? 'This preview will replace the existing category image once saved.'
                                                                : 'This image will be used as the category cover image.'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={removeCoverImageHandler}
                                                            className="self-start rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-4"
                                                        >
                                                            Remove selected image
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {coverPreview && !coverObjectUrl && editingCategory?.cover_image_url && !removeCoverImage && (
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4">
                                                    <img
                                                        src={coverPreview}
                                                        alt="Current cover"
                                                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg sm:rounded-xl object-cover ring-1 ring-slate-200"
                                                    />
                                                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                                                        <span className="text-xs text-slate-500">
                                                            Current category image. Upload a new file to replace it.
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={removeCoverImageHandler}
                                                            className="self-start rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-4"
                                                        >
                                                            Remove image
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    {/* Is Active */}
                                    <div className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
                                        <Controller
                                            name="is_active"
                                            control={control}
                                            render={({ field }) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                            )}
                                        />
                                        <InputLabel htmlFor="is_active" className="mb-0 cursor-pointer">
                                            Active for selection
                                        </InputLabel>
                                    </div>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    {/* Description */}
                                    <div className="flex flex-col gap-1.5 sm:gap-2">
                                        <InputLabel htmlFor="description">Description</InputLabel>
                                        <Controller
                                            name="description"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <>
                                                    <textarea
                                                        id="description"
                                                        value={field.value || ''}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            trigger('description');
                                                        }}
                                                        onBlur={async () => {
                                                            field.onBlur();
                                                            await trigger('description');
                                                        }}
                                                        placeholder="Optional notes for internal reference."
                                                        className={`min-h-[100px] sm:min-h-[120px] mt-1 rounded-lg sm:rounded-xl border ${fieldState.error ? 'border-red-300' : 'border-slate-300'} bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm ${fieldState.error ? 'focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                    />
                                                    {fieldState.error && <InputError message={fieldState.error.message} />}
                                                </>
                                            )}
                                        />
                                    </div>

                                    {/* Styles */}
                                    <div className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <InputLabel>Styles</InputLabel>
                                            {watch('style_ids')?.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Keep only styles that are assigned to products (locked styles)
                                                        const currentStyleIds = watch('style_ids') || [];
                                                        const stylesToKeep = currentStyleIds.filter((id) => stylesAssignedToProducts.has(id));
                                                        setValue('style_ids', stylesToKeep);
                                                        trigger('style_ids');
                                                    }}
                                                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                                                    title={stylesAssignedToProducts.size > 0 ? 'Only removable styles will be removed. Styles assigned to products will remain.' : ''}
                                                >
                                                    Remove all
                                                </button>
                                            )}
                                        </div>
                                        <Controller
                                            name="style_ids"
                                            control={control}
                                            render={({ field }) => {
                                                const styleIds = field.value || [];
                                                if (!styles || styles.length === 0) {
                                                    return (
                                                        <div className="rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-400">
                                                            No styles available. Create styles first in the Styles section.
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <Menu as="div" className="relative">
                                                        <Menu.Button className="w-full min-h-[44px] rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-left text-xs sm:text-sm">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {styleIds.length > 0 ? (
                                                                    styleIds.map((styleId) => {
                                                                        const style = styles.find((s) => s.id === styleId);
                                                                        if (!style) return null;
                                                                        const isAssignedToProducts = stylesAssignedToProducts.has(styleId);
                                                                        return (
                                                                            <span
                                                                                key={styleId}
                                                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-xs font-medium ${
                                                                                    isAssignedToProducts
                                                                                        ? 'bg-amber-100 text-amber-700'
                                                                                        : 'bg-sky-100 text-sky-700'
                                                                                }`}
                                                                                title={isAssignedToProducts ? 'This style is assigned to products and cannot be removed' : ''}
                                                                            >
                                                                                {style.name}
                                                                                {!isAssignedToProducts && (
                                                                                    <span
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onMouseDown={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            field.onChange(styleIds.filter((id) => id !== styleId));
                                                                                        }}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                field.onChange(styleIds.filter((id) => id !== styleId));
                                                                                            }
                                                                                        }}
                                                                                        className="rounded-full hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                                        </svg>
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <span className="text-xs sm:text-sm text-slate-400">Select styles</span>
                                                                )}
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="ml-auto h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </Menu.Button>
                                                        <Transition
                                                            enter="transition ease-out duration-100"
                                                            enterFrom="transform opacity-0 scale-95"
                                                            enterTo="transform opacity-100 scale-100"
                                                            leave="transition ease-in duration-75"
                                                            leaveFrom="transform opacity-100 scale-100"
                                                            leaveTo="transform opacity-0 scale-95"
                                                        >
                                                            <Menu.Items className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                <div className="p-2 border-b border-slate-200">
                                                                    <input
                                                                        type="text"
                                                                        value={styleSearchQuery}
                                                                        onChange={(e) => setStyleSearchQuery(e.target.value)}
                                                                        placeholder="Search styles..."
                                                                        className="w-full rounded-lg sm:rounded-xl border border-slate-300 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                <div className="max-h-60 overflow-auto p-2">
                                                                    {styles
                                                                        .filter((style) =>
                                                                            style.name.toLowerCase().includes(styleSearchQuery.toLowerCase())
                                                                        )
                                                                        .map((style) => {
                                                                            const isChecked = styleIds.includes(style.id);
                                                                            const isAssignedToProducts = stylesAssignedToProducts.has(style.id);
                                                                            return (
                                                                                <Menu.Item key={style.id}>
                                                                                    {({ active }) => (
                                                                                        <div
                                                                                            className={`flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 ${
                                                                                                isAssignedToProducts && isChecked
                                                                                                    ? 'cursor-not-allowed opacity-75'
                                                                                                    : 'cursor-pointer'
                                                                                            } ${active && !(isAssignedToProducts && isChecked) ? 'bg-slate-50' : ''}`}
                                                                                            onClick={(e) => {
                                                                                                if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                                                                                    e.stopPropagation();
                                                                                                    e.preventDefault();
                                                                                                    // Prevent unchecking if style is assigned to products
                                                                                                    if (isChecked && isAssignedToProducts) {
                                                                                                        return;
                                                                                                    }
                                                                                                    if (isChecked) {
                                                                                                        field.onChange(styleIds.filter((id) => id !== style.id));
                                                                                                    } else {
                                                                                                        field.onChange([...styleIds, style.id]);
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            title={isAssignedToProducts && isChecked ? 'This style is assigned to products and cannot be removed' : ''}
                                                                                        >
                                                                                            <Checkbox
                                                                                                checked={isChecked}
                                                                                                disabled={isAssignedToProducts && isChecked}
                                                                                                onChange={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    // Prevent unchecking if style is assigned to products
                                                                                                    if (e.target.checked) {
                                                                                                        field.onChange([...styleIds, style.id]);
                                                                                                    } else {
                                                                                                        if (!isAssignedToProducts) {
                                                                                                            field.onChange(styleIds.filter((id) => id !== style.id));
                                                                                                        }
                                                                                                    }
                                                                                                }}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            />
                                                                                            <span className={`text-xs sm:text-sm ${isAssignedToProducts && isChecked ? 'text-amber-700' : 'text-slate-700'}`}>
                                                                                                {style.name}
                                                                                                {isAssignedToProducts && isChecked && (
                                                                                                    <span className="ml-1 text-[10px] text-amber-600">(in use)</span>
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </Menu.Item>
                                                                            );
                                                                        })}
                                                                    {styles.filter((style) =>
                                                                        style.name.toLowerCase().includes(styleSearchQuery.toLowerCase())
                                                                    ).length === 0 && (
                                                                        <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-400 text-center">No styles found</div>
                                                                    )}
                                                                </div>
                                                            </Menu.Items>
                                                        </Transition>
                                                    </Menu>
                                                );
                                            }}
                                        />
                                    </div>

                                    {/* Sizes */}
                                    <div className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <InputLabel>Sizes</InputLabel>
                                            {watch('size_ids')?.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Keep only sizes that are assigned to products (locked sizes)
                                                        const currentSizeIds = watch('size_ids') || [];
                                                        const sizesToKeep = currentSizeIds.filter((id) => sizesAssignedToProducts.has(id));
                                                        setValue('size_ids', sizesToKeep);
                                                        trigger('size_ids');
                                                    }}
                                                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                                                    title={sizesAssignedToProducts.size > 0 ? 'Only removable sizes will be removed. Sizes assigned to products will remain.' : ''}
                                                >
                                                    Remove all
                                                </button>
                                            )}
                                        </div>
                                        <Controller
                                            name="size_ids"
                                            control={control}
                                            render={({ field }) => {
                                                const sizeIds = field.value || [];
                                                if (!sizes || sizes.length === 0) {
                                                    return (
                                                        <div className="rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-400">
                                                            No sizes available. Create sizes first in the Sizes section.
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <Menu as="div" className="relative">
                                                        <Menu.Button className="w-full min-h-[44px] rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-left text-xs sm:text-sm">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {sizeIds.length > 0 ? (
                                                                    sizeIds.map((sizeId) => {
                                                                        const size = sizes.find((s) => s.id === sizeId);
                                                                        if (!size) return null;
                                                                        const isAssignedToProducts = sizesAssignedToProducts.has(sizeId);
                                                                        return (
                                                                            <span
                                                                                key={sizeId}
                                                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-xs font-medium ${
                                                                                    isAssignedToProducts
                                                                                        ? 'bg-amber-100 text-amber-700'
                                                                                        : 'bg-sky-100 text-sky-700'
                                                                                }`}
                                                                                title={isAssignedToProducts ? 'This size is assigned to products and cannot be removed' : ''}
                                                                            >
                                                                                {size.name}
                                                                                {!isAssignedToProducts && (
                                                                                    <span
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onMouseDown={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            field.onChange(sizeIds.filter((id) => id !== sizeId));
                                                                                        }}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                field.onChange(sizeIds.filter((id) => id !== sizeId));
                                                                                            }
                                                                                        }}
                                                                                        className="rounded-full hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                                        </svg>
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <span className="text-slate-400">Select sizes</span>
                                                                )}
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="ml-auto h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </Menu.Button>
                                                        <Transition
                                                            enter="transition ease-out duration-100"
                                                            enterFrom="transform opacity-0 scale-95"
                                                            enterTo="transform opacity-100 scale-100"
                                                            leave="transition ease-in duration-75"
                                                            leaveFrom="transform opacity-100 scale-100"
                                                            leaveTo="transform opacity-0 scale-95"
                                                        >
                                                            <Menu.Items className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                <div className="p-2 border-b border-slate-200">
                                                                    <input
                                                                        type="text"
                                                                        value={sizeSearchQuery}
                                                                        onChange={(e) => setSizeSearchQuery(e.target.value)}
                                                                        placeholder="Search sizes..."
                                                                        className="w-full rounded-lg sm:rounded-xl border border-slate-300 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                                <div className="max-h-60 overflow-auto p-2">
                                                                    {sizes
                                                                        .filter((size) =>
                                                                            size.name.toLowerCase().includes(sizeSearchQuery.toLowerCase())
                                                                        )
                                                                        .map((size) => {
                                                                            const isChecked = sizeIds.includes(size.id);
                                                                            const isAssignedToProducts = sizesAssignedToProducts.has(size.id);
                                                                            return (
                                                                                <Menu.Item key={size.id}>
                                                                                    {({ active }) => (
                                                                                        <div
                                                                                            className={`flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 ${
                                                                                                isAssignedToProducts && isChecked
                                                                                                    ? 'cursor-not-allowed opacity-75'
                                                                                                    : 'cursor-pointer'
                                                                                            } ${active && !(isAssignedToProducts && isChecked) ? 'bg-slate-50' : ''}`}
                                                                                            onClick={(e) => {
                                                                                                if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                                                                                    e.stopPropagation();
                                                                                                    e.preventDefault();
                                                                                                    // Prevent unchecking if size is assigned to products
                                                                                                    if (isChecked && isAssignedToProducts) {
                                                                                                        return;
                                                                                                    }
                                                                                                    if (isChecked) {
                                                                                                        field.onChange(sizeIds.filter((id) => id !== size.id));
                                                                                                    } else {
                                                                                                        field.onChange([...sizeIds, size.id]);
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            title={isAssignedToProducts && isChecked ? 'This size is assigned to products and cannot be removed' : ''}
                                                                                        >
                                                                                            <Checkbox
                                                                                                checked={isChecked}
                                                                                                disabled={isAssignedToProducts && isChecked}
                                                                                                onChange={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    // Prevent unchecking if size is assigned to products
                                                                                                    if (e.target.checked) {
                                                                                                        field.onChange([...sizeIds, size.id]);
                                                                                                    } else {
                                                                                                        if (!isAssignedToProducts) {
                                                                                                            field.onChange(sizeIds.filter((id) => id !== size.id));
                                                                                                        }
                                                                                                    }
                                                                                                }}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            />
                                                                                            <span className={`text-xs sm:text-sm ${isAssignedToProducts && isChecked ? 'text-amber-700' : 'text-slate-700'}`}>
                                                                                                {size.name}
                                                                                                {isAssignedToProducts && isChecked && (
                                                                                                    <span className="ml-1 text-[10px] text-amber-600">(in use)</span>
                                                                                                )}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </Menu.Item>
                                                                            );
                                                                        })}
                                                                    {sizes.filter((size) =>
                                                                        size.name.toLowerCase().includes(sizeSearchQuery.toLowerCase())
                                                                    ).length === 0 && (
                                                                        <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-slate-400 text-center">No sizes found</div>
                                                                    )}
                                                                </div>
                                                            </Menu.Items>
                                                        </Transition>
                                                    </Menu>
                                                );
                                            }}
                                        />
                                    </div>

                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal show={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Remove Category" message={deleteConfirm ? `Are you sure you want to remove category ${deleteConfirm.name}?` : ''} confirmText="Remove" variant="danger" />
            <ConfirmationModal show={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} onConfirm={async () => {
                try {
                    await adminService.bulkDeleteCategories(selectedCategories);
                    setSelectedCategories([]);
                    await loadCategories();
                } catch (error: any) {
                    toastError(error.response?.data?.message || 'Failed to delete categories. Please try again.');
                } finally {
                    setBulkDeleteConfirm(false);
                }
            }} title="Delete Categories" message={`Are you sure you want to delete ${selectedCategories.length} selected category(s)?`} confirmText="Delete" variant="danger" />
        </div>
    );
}




