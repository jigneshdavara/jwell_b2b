'use client';

import RichTextEditor from '@/components/RichTextEditor';

type ProductDescriptionSectionProps = {
    description: string;
    onDescriptionChange: (value: string) => void;
    error?: string;
};

export default function ProductDescriptionSection({
    description,
    onDescriptionChange,
    error,
}: ProductDescriptionSectionProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Product description</h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Provide merchandising copy, craftsmanship details, and any atelier notes for this SKU.
                    </p>
                </div>
            </div>

            <div className="mt-4 sm:mt-6">
                <RichTextEditor
                    value={description}
                    onChange={onDescriptionChange}
                    className={`overflow-hidden rounded-2xl sm:rounded-3xl border ${
                        error ? 'border-rose-300' : 'border-slate-200'
                    }`}
                    placeholder="Detail the design notes, materials, finish, and atelier craftsmanship."
                />
                {error && <span className="mt-2 block text-xs text-rose-500">{error}</span>}
            </div>
        </div>
    );
}

