"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { Menu, Transition } from "@headlessui/react";
import React from "react";
import { adminService } from "@/services/adminService";
import { PaginationMeta, generatePaginationLinks } from "@/utils/pagination";
import { toastError } from "@/utils/toast";

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

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState<CategoryRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formState, setFormState] = useState({
        parent_id: '' as string | number,
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0 as number | string,
        style_ids: [] as number[],
        size_ids: [] as number[],
    });

    const [styles, setStyles] = useState<Style[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
    const [removeCoverImage, setRemoveCoverImage] = useState(false);
    const [styleSearchQuery, setStyleSearchQuery] = useState('');
    const [sizeSearchQuery, setSizeSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getImageUrl = (imagePath: string | null | undefined): string | null => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
        return `${baseUrl}/${imagePath}`.replace(/(?<!:)\/{2,}/g, '/');
    };

    useEffect(() => {
        loadCategories();
        loadStyles();
        loadSizes();
    }, [currentPage, perPage]);

    const loadStyles = async () => {
        try {
            const response = await adminService.getStyles(1, 1000); // Load all styles
            const items = response.data.items || response.data.data || [];
            setStyles(items.map((item: any) => ({ id: Number(item.id), name: item.name })));
        } catch (error: any) {
        }
    };

    const loadSizes = async () => {
        try {
            const response = await adminService.getSizes(1, 1000); // Load all sizes
            const items = response.data.items || response.data.data || [];
            setSizes(items.map((item: any) => ({ id: Number(item.id), name: item.name })));
        } catch (error: any) {
        }
    };

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await adminService.getCategories(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

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
                    cover_image_url: item.cover_image_url ? getImageUrl(item.cover_image_url) : null,
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

    // Build category tree from flat list
    const categoryTree = useMemo(() => {
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
    }, [data.data]);

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
        if (formState.parent_id === '') {
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
        return findCategoryName(availableCategoryTree, formState.parent_id) || 'Select parent category';
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
        const isSelected = String(formState.parent_id) === String(node.id);
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);

        return (
            <div key={node.id} className="relative">
                <Menu.Item>
                    {({ active, close }) => (
                        <div
                            className={`flex items-center gap-1 rounded-lg transition-colors pl-3 ${
                                isSelected
                                    ? 'bg-sky-50 text-sky-700'
                                    : active
                                    ? 'bg-slate-50 text-slate-700'
                                    : 'text-slate-700'
                            }`}
                        >
                            <div className="flex items-center" style={{ width: `${level * 20}px` }}>
                                {level > 0 && (
                                    <div className="w-px h-6 bg-slate-200 mr-2"></div>
                                )}
                            </div>

                            {hasChildren ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleNode(node.id);
                                    }}
                                    className="flex items-center justify-center w-5 h-5 rounded hover:bg-slate-200 transition-colors flex-shrink-0"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-3 w-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <div className="w-5 h-5 flex-shrink-0"></div>
                            )}
                            <div
                                className={`flex-1 py-2 cursor-pointer rounded ${
                                    isSelected ? 'font-medium' : ''
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFormState(prev => ({ ...prev, parent_id: String(node.id) }));
                                    close();
                                    closeMenu?.();
                                }}
                            >
                                <span className="text-sm">{node.name}</span>
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
    }, [formState.parent_id, expandedNodes]);

    const resetForm = () => {
        setEditingCategory(null);
        setModalOpen(false);
        setExpandedNodes(new Set());
        setFormState({
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
            
            setEditingCategory({
                ...category,
                styles: fullCategory.styles || [],
                sizes: fullCategory.sizes || [],
                cover_image_url: fullCategory.cover_image_url ? getImageUrl(fullCategory.cover_image_url) : null,
            });
            setFormState({
                parent_id: fullCategory.parent_id ? String(fullCategory.parent_id) : '',
                code: fullCategory.code ?? '',
                name: fullCategory.name,
                description: fullCategory.description ?? '',
                is_active: fullCategory.is_active,
                display_order: fullCategory.display_order,
                style_ids: fullCategory.styles?.map((s: any) => Number(s.id)) ?? [],
                size_ids: fullCategory.sizes?.map((s: any) => Number(s.id)) ?? [],
            });
            setCoverPreview(fullCategory.cover_image_url ? getImageUrl(fullCategory.cover_image_url) : null);
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
            setEditingCategory(category);
            setFormState({
                parent_id: category.parent_id ? String(category.parent_id) : '',
                code: category.code ?? '',
                name: category.name,
                description: category.description ?? '',
                is_active: category.is_active,
                display_order: category.display_order,
                style_ids: [],
                size_ids: [],
            });
            setCoverPreview(category.cover_image_url ? getImageUrl(category.cover_image_url) : null);
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
            setCoverPreview(editingCategory?.cover_image_url ? getImageUrl(editingCategory.cover_image_url) : null);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', formState.name);
            if (formState.code) formData.append('code', formState.code);
            if (formState.description) formData.append('description', formState.description);
            if (formState.parent_id) formData.append('parent_id', String(formState.parent_id));
            formData.append('is_active', String(formState.is_active));
            formData.append('display_order', String(formState.display_order));
            
            // Append arrays - NestJS expects arrays as multiple entries with same key
            formState.style_ids.forEach(id => formData.append('style_ids', String(id)));
            formState.size_ids.forEach(id => formData.append('size_ids', String(id)));
            
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
            toastError(error.response?.data?.message || 'Failed to save category. Please try again.');
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
                setDeleteConfirm(null);
                await loadCategories();
            } catch (error: any) {
                toastError(error.response?.data?.message || 'Failed to delete category. Please try again.');
            }
        }
    };

    if (loading && !data.data.length) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
                    <p className="mt-2 text-sm text-slate-500">Manage product categories for catalogue organization.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New category
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                    <div className="font-semibold text-slate-700">Categories ({data.meta.total})</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{selectedCategories.length} selected</span>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedCategories.length === 0}
                            className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Bulk delete
                        </button>
                        <select value={perPage} onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }} className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:ring-0">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                        <tr>
                            <th className="px-5 py-3">
                                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold" />
                            </th>
                            <th className="px-5 py-3 text-left">Code</th>
                            <th className="px-5 py-3 text-left">Name</th>
                            <th className="px-5 py-3 text-left">Parent</th>
                            <th className="px-5 py-3 text-left">Order</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {data.data.map((category) => (
                            <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3">
                                    <input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => toggleSelection(category.id)} className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold" />
                                </td>
                                <td className="px-5 py-3 text-slate-700">{category.code || '-'}</td>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    <div className="flex flex-col gap-1">
                                        <span>{category.name}</span>
                                        {category.description && <span className="text-xs text-slate-500 font-normal">{category.description}</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-slate-500">{category.parent?.name ?? '—'}</td>
                                <td className="px-5 py-3 text-slate-500">{category.display_order}</td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {category.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEditModal(category)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M16.862 4.487l1.687-1.688a1.875 1.125 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                        <button onClick={() => toggleActivation(category)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600">
                                            {category.is_active ? <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M15.75 5.25v13.5m-7.5-13.5v13.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </button>
                                        <button onClick={() => setDeleteConfirm(category)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M14.74 9l-.34 9m-4.74-9l.34 9m9.96-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination 
                meta={data.meta} 
                onPageChange={setCurrentPage} 
            />

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">{editingCategory ? `Edit category: ${editingCategory.name}` : 'Create new category'}</h2>
                            <div className="flex items-center gap-3">
                                <button onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">Cancel</button>
                                <button type="submit" form="category-form" disabled={loading} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{editingCategory ? 'Update category' : 'Create category'}</button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                    aria-label="Close modal"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleSubmit} className="space-y-6" id="category-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Parent Category</span>
                                            <Menu as="div" className="relative">
                                                <Menu.Button className="w-full min-h-[44px] rounded-2xl border border-slate-300 bg-white px-4 py-2 text-left text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className={formState.parent_id === '' ? 'text-slate-500' : 'text-slate-900'}>
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
                                                    <Menu.Items className="absolute z-50 mt-2 w-full max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                        <div className="p-2">
                                                            <Menu.Item>
                                                                {({ active, close }) => (
                                                                    <div
                                                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                                                                            formState.parent_id === ''
                                                                                ? 'bg-sky-50 text-sky-700 font-medium'
                                                                                : active
                                                                                ? 'bg-slate-50 text-slate-700'
                                                                                : 'text-slate-700'
                                                                        }`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (formState.parent_id !== '') {
                                                                                setFormState(prev => ({ ...prev, parent_id: '' }));
                                                                                close();
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="w-5 h-5"></div>
                                                                        <span className="text-sm">None (Top Level)</span>
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
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Code</span>
                                            <input
                                                type="text"
                                                value={formState.code}
                                                onChange={(e) => setFormState(prev => ({ ...prev, code: e.target.value }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="e.g., RNG, NKL"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name</span>
                                            <input
                                                type="text"
                                                value={formState.name}
                                                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display order</span>
                                            <input
                                                type="number"
                                                value={formState.display_order}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormState(prev => ({ ...prev, display_order: value === '' ? '' : Number(value) }));
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value === '') {
                                                        setFormState(prev => ({ ...prev, display_order: 0 }));
                                                    }
                                                }}
                                                onFocus={(e) => {
                                                    if (e.target.value === '0') {
                                                        e.target.select();
                                                    }
                                                }}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                            />
                                        </label>
                                        <label className="flex flex-col gap-3 text-sm text-slate-600">
                                            <span>Cover Image</span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleCoverChange}
                                                className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                                            />
                                            {coverPreview && coverObjectUrl && (
                                                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                                                    <img
                                                        src={coverPreview}
                                                        alt="Cover preview"
                                                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            {editingCategory
                                                                ? 'This preview will replace the existing category image once saved.'
                                                                : 'This image will be used as the category cover image.'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={removeCoverImageHandler}
                                                            className="self-start rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                        >
                                                            Remove selected image
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {coverPreview && !coverObjectUrl && editingCategory?.cover_image_url && !removeCoverImage && (
                                                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                                                    <img
                                                        src={coverPreview}
                                                        alt="Current cover"
                                                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            Current category image. Upload a new file to replace it.
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={removeCoverImageHandler}
                                                            className="self-start rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                        >
                                                            Remove image
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_active}
                                            onChange={(e) => setFormState(prev => ({ ...prev, is_active: e.target.checked }))}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2 text-sm text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span>Styles</span>
                                            {formState.style_ids && formState.style_ids.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormState(prev => ({ ...prev, style_ids: [] }))}
                                                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                                                >
                                                    Remove all
                                                </button>
                                            )}
                                        </div>
                                        {styles && styles.length > 0 ? (
                                            <Menu as="div" className="relative">
                                                <Menu.Button className="w-full min-h-[44px] rounded-2xl border border-slate-300 bg-white px-4 py-2 text-left text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {formState.style_ids && formState.style_ids.length > 0 ? (
                                                            formState.style_ids.map((styleId) => {
                                                                const style = styles.find((s) => s.id === styleId);
                                                                if (!style) return null;
                                                                return (
                                                                    <span
                                                                        key={styleId}
                                                                        className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                                                                    >
                                                                        {style.name}
                                                                        <span
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setFormState(prev => ({ ...prev, style_ids: prev.style_ids.filter((id) => id !== styleId) }));
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setFormState(prev => ({ ...prev, style_ids: prev.style_ids.filter((id) => id !== styleId) }));
                                                                                }
                                                                            }}
                                                                            className="rounded-full hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </span>
                                                                    </span>
                                                                );
                                                            })
                                                        ) : (
                                                            <span className="text-slate-400">Select styles</span>
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
                                                    <Menu.Items className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                        <div className="p-2 border-b border-slate-200">
                                                            <input
                                                                type="text"
                                                                value={styleSearchQuery}
                                                                onChange={(e) => setStyleSearchQuery(e.target.value)}
                                                                placeholder="Search styles..."
                                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                        <div className="max-h-60 overflow-auto p-2">
                                                            {styles
                                                                .filter((style) =>
                                                                    style.name.toLowerCase().includes(styleSearchQuery.toLowerCase())
                                                                )
                                                                .map((style) => {
                                                                    const isChecked = formState.style_ids?.includes(style.id) || false;
                                                                    return (
                                                                        <Menu.Item key={style.id}>
                                                                            {({ active }) => (
                                                                                <div
                                                                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer ${
                                                                                        active ? 'bg-slate-50' : ''
                                                                                    }`}
                                                                                    onClick={(e) => {
                                                                                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                                                                            e.stopPropagation();
                                                                                            e.preventDefault();
                                                                                            const currentIds = formState.style_ids || [];
                                                                                            if (isChecked) {
                                                                                                setFormState(prev => ({ ...prev, style_ids: currentIds.filter((id) => id !== style.id) }));
                                                                                            } else {
                                                                                                setFormState(prev => ({ ...prev, style_ids: [...currentIds, style.id] }));
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isChecked}
                                                                                        onChange={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const currentIds = formState.style_ids || [];
                                                                                            if (e.target.checked) {
                                                                                                setFormState(prev => ({ ...prev, style_ids: [...currentIds, style.id] }));
                                                                                            } else {
                                                                                                setFormState(prev => ({ ...prev, style_ids: currentIds.filter((id) => id !== style.id) }));
                                                                                            }
                                                                                        }}
                                                                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    />
                                                                                    <span className="text-sm text-slate-700">{style.name}</span>
                                                                                </div>
                                                                            )}
                                                                        </Menu.Item>
                                                                    );
                                                                })}
                                                            {styles.filter((style) =>
                                                                style.name.toLowerCase().includes(styleSearchQuery.toLowerCase())
                                                            ).length === 0 && (
                                                                <div className="px-3 py-2 text-sm text-slate-400 text-center">No styles found</div>
                                                            )}
                                                        </div>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">
                                                No styles available. Create styles first in the Styles section.
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 text-sm text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span>Sizes</span>
                                            {formState.size_ids && formState.size_ids.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormState(prev => ({ ...prev, size_ids: [] }))}
                                                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                                                >
                                                    Remove all
                                                </button>
                                            )}
                                        </div>
                                        {sizes && sizes.length > 0 ? (
                                            <Menu as="div" className="relative">
                                                <Menu.Button className="w-full min-h-[44px] rounded-2xl border border-slate-300 bg-white px-4 py-2 text-left text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {formState.size_ids && formState.size_ids.length > 0 ? (
                                                            formState.size_ids.map((sizeId) => {
                                                                const size = sizes.find((s) => s.id === sizeId);
                                                                if (!size) return null;
                                                                return (
                                                                    <span
                                                                        key={sizeId}
                                                                        className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                                                                    >
                                                                        {size.name}
                                                                        <span
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setFormState(prev => ({ ...prev, size_ids: prev.size_ids.filter((id) => id !== sizeId) }));
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' || e.key === ' ') {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    setFormState(prev => ({ ...prev, size_ids: prev.size_ids.filter((id) => id !== sizeId) }));
                                                                                }
                                                                            }}
                                                                            className="rounded-full hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </span>
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
                                                    <Menu.Items className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                        <div className="p-2 border-b border-slate-200">
                                                            <input
                                                                type="text"
                                                                value={sizeSearchQuery}
                                                                onChange={(e) => setSizeSearchQuery(e.target.value)}
                                                                placeholder="Search sizes..."
                                                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                        <div className="max-h-60 overflow-auto p-2">
                                                            {sizes
                                                                .filter((size) =>
                                                                    size.name.toLowerCase().includes(sizeSearchQuery.toLowerCase())
                                                                )
                                                                .map((size) => {
                                                                    const isChecked = formState.size_ids?.includes(size.id) || false;
                                                                    return (
                                                                        <Menu.Item key={size.id}>
                                                                            {({ active }) => (
                                                                                <div
                                                                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer ${
                                                                                        active ? 'bg-slate-50' : ''
                                                                                    }`}
                                                                                    onClick={(e) => {
                                                                                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                                                                            e.stopPropagation();
                                                                                            e.preventDefault();
                                                                                            const currentIds = formState.size_ids || [];
                                                                                            if (isChecked) {
                                                                                                setFormState(prev => ({ ...prev, size_ids: currentIds.filter((id) => id !== size.id) }));
                                                                                            } else {
                                                                                                setFormState(prev => ({ ...prev, size_ids: [...currentIds, size.id] }));
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isChecked}
                                                                                        onChange={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const currentIds = formState.size_ids || [];
                                                                                            if (e.target.checked) {
                                                                                                setFormState(prev => ({ ...prev, size_ids: [...currentIds, size.id] }));
                                                                                            } else {
                                                                                                setFormState(prev => ({ ...prev, size_ids: currentIds.filter((id) => id !== size.id) }));
                                                                                            }
                                                                                        }}
                                                                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    />
                                                                                    <span className="text-sm text-slate-700">{size.name}</span>
                                                                                </div>
                                                                            )}
                                                                        </Menu.Item>
                                                                    );
                                                                })}
                                                            {sizes.filter((size) =>
                                                                size.name.toLowerCase().includes(sizeSearchQuery.toLowerCase())
                                                            ).length === 0 && (
                                                                <div className="px-3 py-2 text-sm text-slate-400 text-center">No sizes found</div>
                                                            )}
                                                        </div>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">
                                                No sizes available. Create sizes first in the Sizes section.
                                            </div>
                                        )}
                                    </div>

                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formState.description}
                                            onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                                            className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes for team (e.g. usage, category)."
                                        />
                                    </label>
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
                    setBulkDeleteConfirm(false);
                    await loadCategories();
                } catch (error: any) {
                    toastError(error.response?.data?.message || 'Failed to delete categories. Please try again.');
                }
            }} title="Delete Categories" message={`Are you sure you want to delete ${selectedCategories.length} selected category(s)?`} confirmText="Delete" variant="danger" />
        </div>
    );
}




