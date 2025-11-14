import Modal from '@/Components/Modal';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

type TaxRow = {
    id: number;
    name: string;
    code: string;
    rate: number;
    description?: string | null;
    is_active: boolean;
    tax_group: {
        id: number;
        name: string;
    } | null;
    created_at?: string | null;
    updated_at?: string | null;
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

type TaxOption = {
    id: number;
    name: string;
};

type TaxesPageProps = PageProps<{
    taxes: Pagination<TaxRow>;
    taxGroups: TaxOption[];
}>;

export default function AdminTaxesIndex() {
    const { taxes, taxGroups } = usePage<TaxesPageProps>().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<TaxRow | null>(null);
    const [perPage, setPerPage] = useState(taxes.per_page ?? 20);

    const form = useForm({
        tax_group_id: '',
        name: '',
        code: '',
        rate: 0,
        description: '',
        is_active: true,
    });

    const resetForm = () => {
        setEditingTax(null);
        setModalOpen(false);
        form.reset();
        form.setData('is_active', true);
        form.setData('rate', 0);
        form.setData('tax_group_id', taxGroups[0]?.id.toString() ?? '');
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (tax: TaxRow) => {
        setEditingTax(tax);
        form.setData({
            tax_group_id: tax.tax_group?.id.toString() ?? '',
            name: tax.name,
            code: tax.code,
            rate: tax.rate,
            description: tax.description ?? '',
            is_active: tax.is_active,
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingTax) {
            form.put(route('admin.settings.taxes.update', editingTax.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        } else {
            form.post(route('admin.settings.taxes.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const deleteTax = (tax: TaxRow) => {
        if (!window.confirm(`Remove tax ${tax.name}?`)) {
            return;
        }

        router.delete(route('admin.settings.taxes.destroy', tax.id), {
            preserveScroll: true,
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
        router.get(route('admin.settings.taxes.index'), { per_page: newPerPage }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Taxes" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Taxes</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Manage tax rates and assign them to tax groups.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New tax
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Taxes ({taxes.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Code</th>
                                <th className="px-5 py-3 text-left">Tax Group</th>
                                <th className="px-5 py-3 text-right">Rate</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {taxes.data.map((tax) => (
                                <tr key={tax.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{tax.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{tax.code}</td>
                                    <td className="px-5 py-3 text-slate-500">{tax.tax_group?.name ?? '—'}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{tax.rate}%</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                tax.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {tax.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(tax)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit tax"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteTax(tax)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete tax"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {taxes.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No taxes defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {taxes.from ?? 0} to {taxes.to ?? 0} of {taxes.total} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {taxes.links.map((link, index) => {
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
                                        link.active ? 'bg-elvee-blue text-white shadow shadow-elvee-blue/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cleanLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">{editingTax ? 'Edit Tax' : 'New Tax'}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="tax-form"
                                    disabled={form.processing}
                                    className="rounded-full bg-elvee-blue px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {form.processing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form id="tax-form" onSubmit={submit} className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Tax Group <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.data.tax_group_id}
                                            onChange={(e) => form.setData('tax_group_id', e.target.value)}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            required
                                        >
                                            <option value="">Select a tax group</option>
                                            {taxGroups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>
                                        {form.errors.tax_group_id && <p className="mt-1 text-xs text-rose-500">{form.errors.tax_group_id}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            required
                                        />
                                        {form.errors.name && <p className="mt-1 text-xs text-rose-500">{form.errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Code <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.code}
                                            onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            required
                                        />
                                        {form.errors.code && <p className="mt-1 text-xs text-rose-500">{form.errors.code}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Rate (%) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={form.data.rate}
                                            onChange={(e) => form.setData('rate', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            required
                                        />
                                        {form.errors.rate && <p className="mt-1 text-xs text-rose-500">{form.errors.rate}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                                        <textarea
                                            value={form.data.description}
                                            onChange={(e) => form.setData('description', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        />
                                        {form.errors.description && <p className="mt-1 text-xs text-rose-500">{form.errors.description}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <input
                                                type="checkbox"
                                                checked={form.data.is_active}
                                                onChange={(e) => form.setData('is_active', e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                            />
                                            <span className="text-sm text-slate-700">Active</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}

