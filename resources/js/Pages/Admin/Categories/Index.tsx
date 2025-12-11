import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';

type CategoryRow = {
    id: number;
    parent_id: number | null;
    parent: { id: number; name: string } | null;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
    cover_image?: string | null;
    cover_image_url?: string | null;
    styles?: Array<{ id: number; name: string }>;
    sizes?: Array<{ id: number; name: string }>;
};

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type ParentCategory = {
    id: number;
    name: string;
};

type CategoryTreeNode = {
    id: number;
    name: string;
    parent_id: number | null;
    children: CategoryTreeNode[];
};

type CategoriesPageProps = PageProps<{
    categories: Pagination<CategoryRow>;
    parentCategories: ParentCategory[];
    categoryTree: CategoryTreeNode[];
    styles: Array<{ id: number; name: string }>;
    sizes: Array<{ id: number; name: string }>;
}>;

export default function AdminCategoriesIndex() {
    const { categories, categoryTree, styles, sizes } = usePage<CategoriesPageProps>().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(categories.per_page ?? 10);
    const [deleteConfirm, setDeleteConfirm] = useState<CategoryRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [styleSearchQuery, setStyleSearchQuery] = useState('');
    const [sizeSearchQuery, setSizeSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

    const form = useForm({
        parent_id: '',
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0 as string | number,
        cover_image: null as File | null,
        remove_cover_image: false,
        style_ids: [] as number[],
        size_ids: [] as number[],
    });

    useEffect(() => {
        const existingIds = new Set(categories.data.map((category) => category.id));
        setSelectedCategories((prev) => prev.filter((id) => existingIds.has(id)));
    }, [categories.data]);

    const allSelected = useMemo(() => {
        if (categories.data.length === 0) {
            return false;
        }
        return selectedCategories.length === categories.data.length;
    }, [categories.data, selectedCategories]);

    const getDescendantIds = (node: CategoryTreeNode): number[] => {
        const ids = [node.id];
        node.children.forEach((child) => {
            ids.push(...getDescendantIds(child));
        });
        return ids;
    };

    const filterTree = (tree: CategoryTreeNode[], excludeIds: number[]): CategoryTreeNode[] => {
        return tree
            .filter((node) => !excludeIds.includes(node.id))
            .map((node) => ({
                ...node,
                children: filterTree(node.children, excludeIds),
            }));
    };

    const availableCategoryTree = useMemo(() => {
        if (!editingCategory || !categoryTree) {
            return categoryTree || [];
        }
        const excludeIds = [editingCategory.id];
        // Get all descendant IDs if we had them in the tree
        const findNode = (tree: CategoryTreeNode[], id: number): CategoryTreeNode | null => {
            for (const node of tree) {
                if (node.id === id) return node;
                const found = findNode(node.children, id);
                if (found) return found;
            }
            return null;
        };
        const editingNode = findNode(categoryTree, editingCategory.id);
        if (editingNode) {
            excludeIds.push(...getDescendantIds(editingNode));
        }
        return filterTree(categoryTree, excludeIds);
    }, [categoryTree, editingCategory]);

    // Get selected category name
    const getSelectedCategoryName = (): string => {
        if (form.data.parent_id === '') {
            return 'None (Top Level)';
        }
        const findCategoryName = (tree: CategoryTreeNode[], id: string): string | null => {
            for (const node of tree) {
                if (String(node.id) === id) {
                    return node.name;
                }
                const found = findCategoryName(node.children, id);
                if (found) return found;
            }
            return null;
        };
        return findCategoryName(availableCategoryTree, form.data.parent_id) || 'Select parent category';
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

    // Render tree node recursively for dropdown with expand/collapse
    const renderTreeNode = (node: CategoryTreeNode, level: number = 0, closeMenu?: () => void): React.ReactNode => {
        const isSelected = String(form.data.parent_id) === String(node.id);
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

                            {/* Expand/Collapse Icon */}
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
                                    form.setData('parent_id', String(node.id));
                                    close();
                                    closeMenu?.();
                                }}
                            >
                                <span className="text-sm">{node.name}</span>
                            </div>
                        </div>
                    )}
                </Menu.Item>

                {/* Render Children if Expanded */}
                {hasChildren && isExpanded && (
                    <div className="relative">
                        {node.children.map((child) => renderTreeNode(child, level + 1, closeMenu))}
                    </div>
                )}
            </div>
        );
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(categories.data.map((category) => category.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((categoryId) => categoryId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingCategory(null);
        setModalOpen(false);
        setExpandedNodes(new Set()); // Reset expanded nodes
        form.reset();
        form.clearErrors();
        form.setData('parent_id', '');
        form.setData('code', '');
        form.setData('name', '');
        form.setData('description', '');
        form.setData('cover_image', null);
        form.setData('remove_cover_image', false);
        form.setData('is_active', true);
        form.setData('display_order', 0);
        form.setData('style_ids', []);
        form.setData('size_ids', []);
        setStyleSearchQuery('');
        setSizeSearchQuery('');
        setCoverPreview(null);
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

        // Update state once with all nodes to expand
        if (nodesToExpand.size > 0) {
            setExpandedNodes((prev) => {
                const newSet = new Set(prev);
                nodesToExpand.forEach((id) => newSet.add(id));
                return newSet;
            });
        }
    };

    const openEditModal = (category: CategoryRow) => {
        setEditingCategory(category);
        form.clearErrors();
        form.setData({
            parent_id: category.parent_id ? String(category.parent_id) : '',
            code: category.code ?? '',
            name: category.name,
            description: category.description ?? '',
            is_active: category.is_active,
            display_order: category.display_order,
            cover_image: null,
            remove_cover_image: false,
            style_ids: category.styles?.map((s) => s.id) ?? [],
            size_ids: category.sizes?.map((s) => s.id) ?? [],
        });
        setCoverPreview(category.cover_image_url ?? null);
        setModalOpen(true);

        // Expand path to parent category if it exists
        if (category.parent_id && categoryTree) {
            expandPathToCategory(category.parent_id, categoryTree);
        }
    };

    useEffect(() => {
        return () => {
            if (coverObjectUrl) {
                URL.revokeObjectURL(coverObjectUrl);
            }
        };
    }, [coverObjectUrl]);

    const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        form.setData('cover_image', file);
        form.setData('remove_cover_image', false);

        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setCoverPreview(objectUrl);
            setCoverObjectUrl(objectUrl);
        } else {
            // If no file selected, show existing image if editing, or clear preview if creating
            setCoverPreview(editingCategory?.cover_image_url ?? null);
        }
    };

    const removeCoverImage = () => {
        form.setData('cover_image', null);
        form.setData('remove_cover_image', true);
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        setCoverPreview(null);
        // Clear file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const hasFile = form.data.cover_image instanceof File;
        const coverImage = form.data.cover_image; // Preserve the file
        const removeCoverImage = form.data.remove_cover_image;
        const parentId = form.data.parent_id ? Number(form.data.parent_id) : null;

        // Set up transform ON THE FORM (not in options)
        form.transform((data) => {
            const transformed: any = {
                ...data,
                parent_id: parentId,
                remove_cover_image: removeCoverImage,
                style_ids: data.style_ids || [],
                size_ids: data.size_ids || [],
                display_order: data.display_order === '' ? 0 : Number(data.display_order),
                ...(editingCategory ? { _method: 'PUT' } : {}), // method spoofing for update
            };

            // Only include cover_image if it's actually a File
            if (hasFile) {
                transformed.cover_image = coverImage;
            } else {
                // Remove cover_image from data if it's not a File
                delete transformed.cover_image;
            }

            return transformed;
        });

        const submitOptions = {
            preserveScroll: true,
            forceFormData: hasFile, // required when file present
            onSuccess: () => {
                resetForm();
            },
            onError: (errors: any) => {
                console.error('Form submission errors:', errors);
            },
            onFinish: () => {
                // reset transform so it doesn't affect other requests
                form.transform((data) => data);
            },
        };

        if (editingCategory) {
            // UPDATE: POST + _method=PUT (Laravel-friendly for file uploads)
            form.post(route('admin.categories.update', editingCategory.id), submitOptions);
        } else {
            // CREATE: normal POST
            form.post(route('admin.categories.store'), submitOptions);
        }
    };

    const toggleCategory = (category: CategoryRow) => {
        router.put(route('admin.categories.update', category.id), {
            parent_id: category.parent_id,
            code: category.code,
            name: category.name,
            description: category.description,
            is_active: !category.is_active,
            display_order: category.display_order,
        }, {
            preserveScroll: true,
        });
    };

    const deleteCategory = (category: CategoryRow) => {
        setDeleteConfirm(category);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            router.delete(route('admin.categories.destroy', deleteConfirm.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteConfirm(null);
                },
            });
        }
    };

    const bulkDelete = () => {
        if (selectedCategories.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = () => {
        router.delete(route('admin.categories.bulk-destroy'), {
            data: { ids: selectedCategories },
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCategories([]);
                setBulkDeleteConfirm(false);
            },
        });
    };

    const changePage = (url: string | null) => {
        if (!url) {
            return;
        }

        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        router.get(route('admin.categories.index'), { per_page: newPerPage }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Categories" />

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
                        <div className="font-semibold text-slate-700">
                            Categories ({categories.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedCategories.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedCategories.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete
                            </button>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all categories"
                                    />
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
                            {categories.data.map((category) => (
                                <tr key={category.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category.id)}
                                            onChange={() => toggleSelection(category.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select category ${category.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-slate-700">{category.code || '-'}</td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{category.name}</span>
                                            {category.description && <span className="text-xs text-slate-500">{category.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{category.parent?.name ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{category.display_order}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {category.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(category)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit category"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory(category)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                title={category.is_active ? 'Pause category' : 'Activate category'}
                                            >
                                                {category.is_active ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteCategory(category)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete category"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No categories defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {categories.from ?? 0} to {categories.to ?? 0} of {categories.total} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.links.map((link, index) => {
                            const cleanLabel = link.label
                                .replace('&laquo;', '«')
                                .replace('&raquo;', '»')
                                .replace(/&nbsp;/g, ' ')
                                .trim();

                            if (!link.url) {
                                return (
                                    <span key={`${link.label}-${index}`} className="rounded-full px-3 py-1 text-sm text-slate-400">
                                        {cleanLabel}
                                    </span>
                                );
                            }

                            return (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    onClick={() => changePage(link.url)}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        link.active ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cleanLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingCategory ? `Edit category: ${editingCategory.name}` : 'Create new category'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="category-form"
                                    disabled={form.processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingCategory ? 'Update category' : 'Create category'}
                                </button>
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
                        <form onSubmit={submit} className="space-y-6" id="category-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Parent Category</span>
                                            <Menu as="div" className="relative">
                                                <Menu.Button className="w-full min-h-[44px] rounded-2xl border border-slate-300 bg-white px-4 py-2 text-left text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className={form.data.parent_id === '' ? 'text-slate-500' : 'text-slate-900'}>
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
                                                                            form.data.parent_id === ''
                                                                                ? 'bg-sky-50 text-sky-700 font-medium'
                                                                                : active
                                                                                ? 'bg-slate-50 text-slate-700'
                                                                                : 'text-slate-700'
                                                                        }`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (form.data.parent_id !== '') {
                                                                                form.setData('parent_id', '');
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
                                            {form.errors.parent_id && <span className="text-xs text-rose-500">{form.errors.parent_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Code</span>
                                            <input
                                                type="text"
                                                value={form.data.code}
                                                onChange={(event) => form.setData('code', event.target.value)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="e.g., RNG, NKL"
                                            />
                                            {form.errors.code && <span className="text-xs text-rose-500">{form.errors.code}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name</span>
                                            <input
                                                type="text"
                                                value={form.data.name}
                                                onChange={(event) => form.setData('name', event.target.value)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                            {form.errors.name && <span className="text-xs text-rose-500">{form.errors.name}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display order</span>
                                            <input
                                                type="number"
                                                value={form.data.display_order === '' || form.data.display_order === undefined ? '' : form.data.display_order}
                                                onChange={(event) => form.setData('display_order', event.target.value === '' ? '' : Number(event.target.value))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                            />
                                            {form.errors.display_order && <span className="text-xs text-rose-500">{form.errors.display_order}</span>}
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
                                            {form.errors.cover_image && (
                                                <span className="text-xs text-rose-500">{form.errors.cover_image}</span>
                                            )}
                                            {coverPreview && (
                                                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                                                    <img
                                                        src={coverPreview}
                                                        alt="Cover preview"
                                                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            {coverObjectUrl && editingCategory
                                                                ? 'This preview will replace the existing category image once saved.'
                                                                : coverObjectUrl
                                                                ? 'This image will be used as the category cover image.'
                                                                : 'Current category image. Upload a new file to replace it.'}
                                                        </span>
                                                        {coverObjectUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={removeCoverImage}
                                                                className="self-start rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                            >
                                                                Remove selected image
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {!coverPreview && editingCategory?.cover_image_url && (
                                                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                                                    <img
                                                        src={editingCategory.cover_image_url}
                                                        alt="Current cover"
                                                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            Current category image. Upload a new file to replace it.
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={removeCoverImage}
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
                                            checked={form.data.is_active}
                                            onChange={(event) => form.setData('is_active', event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2 text-sm text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span>Styles</span>
                                            {form.data.style_ids && form.data.style_ids.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => form.setData('style_ids', [])}
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
                                                        {form.data.style_ids && form.data.style_ids.length > 0 ? (
                                                            form.data.style_ids.map((styleId) => {
                                                                const style = styles.find((s) => s.id === styleId);
                                                                if (!style) return null;
                                                                return (
                                                                    <span
                                                                        key={styleId}
                                                                        className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                                                                    >
                                                                        {style.name}
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                form.setData('style_ids', form.data.style_ids?.filter((id) => id !== styleId) || []);
                                                                            }}
                                                                            className="rounded-full hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
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
                                                                .map((style) => (
                                                                    <Menu.Item key={style.id}>
                                                                        {({ active }) => (
                                                                            <label
                                                                                className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer ${
                                                                                    active ? 'bg-slate-50' : ''
                                                                                }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={form.data.style_ids?.includes(style.id) || false}
                                                                                    onChange={(e) => {
                                                                                        const currentIds = form.data.style_ids || [];
                                                                                        if (e.target.checked) {
                                                                                            form.setData('style_ids', [...currentIds, style.id]);
                                                                                        } else {
                                                                                            form.setData('style_ids', currentIds.filter((id) => id !== style.id));
                                                                                        }
                                                                                    }}
                                                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                />
                                                                                <span className="text-sm text-slate-700">{style.name}</span>
                                                                            </label>
                                                                        )}
                                                                    </Menu.Item>
                                                                ))}
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
                                        {form.errors.style_ids && (
                                            <span className="text-xs text-rose-500">{form.errors.style_ids}</span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 text-sm text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span>Sizes</span>
                                            {form.data.size_ids && form.data.size_ids.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => form.setData('size_ids', [])}
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
                                                        {form.data.size_ids && form.data.size_ids.length > 0 ? (
                                                            form.data.size_ids.map((sizeId) => {
                                                                const size = sizes.find((s) => s.id === sizeId);
                                                                if (!size) return null;
                                                                return (
                                                                    <span
                                                                        key={sizeId}
                                                                        className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                                                                    >
                                                                        {size.name}
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                form.setData('size_ids', form.data.size_ids?.filter((id) => id !== sizeId) || []);
                                                                            }}
                                                                            className="rounded-full hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                            </svg>
                                                                        </button>
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
                                                                .map((size) => (
                                                                    <Menu.Item key={size.id}>
                                                                        {({ active }) => (
                                                                            <label
                                                                                className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer ${
                                                                                    active ? 'bg-slate-50' : ''
                                                                                }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={form.data.size_ids?.includes(size.id) || false}
                                                                                    onChange={(e) => {
                                                                                        const currentIds = form.data.size_ids || [];
                                                                                        if (e.target.checked) {
                                                                                            form.setData('size_ids', [...currentIds, size.id]);
                                                                                        } else {
                                                                                            form.setData('size_ids', currentIds.filter((id) => id !== size.id));
                                                                                        }
                                                                                    }}
                                                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                />
                                                                                <span className="text-sm text-slate-700">{size.name}</span>
                                                                            </label>
                                                                        )}
                                                                    </Menu.Item>
                                                                ))}
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
                                        {form.errors.size_ids && (
                                            <span className="text-xs text-rose-500">{form.errors.size_ids}</span>
                                        )}
                                    </div>

                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={form.data.description}
                                            onChange={(event) => form.setData('description', event.target.value)}
                                            className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes for team (e.g. usage, category)."
                                        />
                                        {form.errors.description && <span className="text-xs text-rose-500">{form.errors.description}</span>}
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Category"
                message={deleteConfirm ? `Are you sure you want to remove category ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Categories"
                message={`Are you sure you want to delete ${selectedCategories.length} selected category(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </AdminLayout>
    );
}

