'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import AlertModal from '@/components/ui/AlertModal';

type Brand = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    products_count: number;
};

export default function AdminBrandsPage() {
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([
        { id: 1, name: 'Elvee Atelier', slug: 'elvee-atelier', description: 'Luxury handcrafted collections', is_active: true, products_count: 124 },
        { id: 2, name: 'Signature', slug: 'signature', description: 'Daily wear essentials', is_active: true, products_count: 85 },
        { id: 3, name: 'Heritage', slug: 'heritage', description: 'Antique bridal jewelry', is_active: false, products_count: 42 },
    ]);

    const [selectedBrands, setSelectedProducts] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    
    const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => {} });

    const filteredBrands = useMemo(() => {
        return brands.filter(b => 
            b.name.toLowerCase().includes(search.toLowerCase()) || 
            b.slug.toLowerCase().includes(search.toLowerCase())
        );
    }, [brands, search]);

    const allSelected = filteredBrands.length > 0 && selectedBrands.length === filteredBrands.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(filteredBrands.map(b => b.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedProducts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const deleteBrand = (id: number) => {
        setConfirmModal({
            show: true,
            title: 'Delete Brand',
            message: 'Are you sure you want to delete this brand? Products linked to it may become unbranded.',
            onConfirm: () => {
                setBrands(prev => prev.filter(b => b.id !== id));
                setConfirmModal({ ...confirmModal, show: false });
            }
        });
    };

    return (
        <div className="space-y-8">
            <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/80">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">Brands</h1>
                    <div className="flex flex-wrap gap-3">
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search brands..."
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
                        />
                        <Link href="/admin/brands/create" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800">
                            Add Brand
                        </Link>
                    </div>
                </div>
            </section>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                        <tr>
                            <th className="px-6 py-4">
                                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-slate-300 text-sky-600" />
                            </th>
                            <th className="px-6 py-4 text-left">Brand Name</th>
                            <th className="px-6 py-4 text-left">Slug</th>
                            <th className="px-6 py-4 text-left">Products</th>
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredBrands.map(brand => (
                            <tr key={brand.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-center">
                                    <input type="checkbox" checked={selectedBrands.includes(brand.id)} onChange={() => toggleSelection(brand.id)} className="rounded border-slate-300 text-sky-600" />
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-900">{brand.name}</td>
                                <td className="px-6 py-4 text-slate-500">{brand.slug}</td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{brand.products_count} designs</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${brand.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {brand.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => deleteBrand(brand.id)} className="p-2 text-slate-400 hover:text-rose-600">
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" strokeWidth={2} /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal 
                show={confirmModal.show} 
                onClose={() => setConfirmModal({ ...confirmModal, show: false })} 
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant="danger"
            />
        </div>
    );
}

