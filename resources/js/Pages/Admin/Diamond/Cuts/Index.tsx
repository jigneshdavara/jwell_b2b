import Modal from '@/Components/Modal';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type DiamondCutRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    position: number;
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

type DiamondCutsPageProps = PageProps<{
    cuts: Pagination<DiamondCutRow>;
}>;

export default function AdminDiamondCutsIndex() {
    const { cuts } = usePage<DiamondCutsPageProps>().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCut, setEditingCut] = useState<DiamondCutRow | null>(null);
    const [selectedCuts, setSelectedCuts] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(cuts.per_page ?? 20);

    const form = useForm({
        name: '',
        description: '',
        is_active: true,
        position: 0,
    });

    useEffect(() => {
        const existingIds = new Set(cuts.data.map((cut) => cut.id));
        setSelectedCuts((prev) => prev.filter((id) => existingIds.has(id)));
    }, [cuts.data]);

    const allSelected = useMemo(() => {
        if (cuts.data.length === 0) {
            return false;
        }
        return selectedCuts.length === cuts.data.length;
    }, [cuts.data, selectedCuts]);

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedCuts([]);
        } else {
            setSelectedCuts(cuts.data.map((cut) => cut.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedCuts((prev) =>
            prev.includes(id) ? prev.filter((cutId) => cutId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingCut(null);
        setModalOpen(false);
        form.reset();
        form.setData('is_active', true);
        form.setData('position', 0);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (cut: DiamondCutRow) => {
        setEditingCut(cut);
        form.setData({
            name: cut.name,
            description: cut.description ?? '',
            is_active: cut.is_active,
            position: cut.position,
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingCut) {
            form.post(route('admin.diamond.cuts.update', editingCut.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                method: 'put',
            });
        } else {
            form.post(route('admin.diamond.cuts.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const toggleCut = (cut: DiamondCutRow) => {
        router.put(route('admin.diamond.cuts.update', cut.id), {
            name: cut.name,
            description: cut.description,
            is_active: !cut.is_active,
            position: cut.position,
        }, {
            preserveScroll: true,
        });
    };

    const deleteCut = (cut: DiamondCutRow) => {
        if (!window.confirm(`Remove diamond cut ${cut.name}?`)) {
            return;
        }

        router.delete(route('admin.diamond.cuts.destroy', cut.id), {
            preserveScroll: true,
        });
    };

    const bulkDelete = () => {
        if (selectedCuts.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedCuts.length} selected diamond cut grade(s)?`)) {
            return;
        }

        router.delete(route('admin.diamond.cuts.bulk-destroy'), {
            data: { ids: selectedCuts },
            preserveScroll: true,
            onSuccess: () => setSelectedCuts([]),
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
        router.get(route('admin.diamond.cuts.index'), { per_page: newPerPage }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Diamond cut grades" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Diamond cut grades</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Configure cut quality references (e.g. Excellent, Very Good) for product workflows.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New cut grade
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Cut grades ({cuts.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedCuts.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedCuts.length === 0}
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
                                        aria-label="Select all cut grades"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Order</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {cuts.data.map((cut) => (
                                <tr key={cut.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCuts.includes(cut.id)}
                                            onChange={() => toggleSelection(cut.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select cut grade ${cut.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{cut.name}</span>
                                            {cut.description && <span className="text-xs text-slate-500">{cut.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{cut.slug}</td>
                                    <td className="px-5 py-3 text-slate-500">{cut.position}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                cut.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {cut.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(cut)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit cut grade"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleCut(cut)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                title={cut.is_active ? 'Pause cut grade' : 'Activate cut grade'}
                                            >
                                                {cut.is_active ? (
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
                                                onClick={() => deleteCut(cut)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete cut grade"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {cuts.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No cut grades defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {cuts.from ?? 0} to {cuts.to ?? 0} of {cuts.total} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {cuts.links.map((link, index) => {
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
                                {editingCut ? `Edit diamond cut: ${editingCut.name}` : 'Create new diamond cut'}
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
                                    form="cut-form"
                                    disabled={form.processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingCut ? 'Update diamond cut' : 'Create diamond cut'}
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
                        <form onSubmit={submit} className="space-y-6" id="cut-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
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
                                                value={form.data.position}
                                                onChange={(event) => form.setData('position', Number(event.target.value))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                            />
                                            {form.errors.position && <span className="text-xs text-rose-500">{form.errors.position}</span>}
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
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={form.data.description}
                                            onChange={(event) => form.setData('description', event.target.value)}
                                            className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes (e.g. facet proportions guidance)."
                                        />
                                        {form.errors.description && <span className="text-xs text-rose-500">{form.errors.description}</span>}
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
