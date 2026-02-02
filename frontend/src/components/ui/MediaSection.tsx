'use client';

import React, { useMemo } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { getMediaUrl } from '@/utils/mediaUrl';
import type { ProductFormData } from '@/lib/validation/admin.schema';
import type { AdminProductMedia as ProductMedia, AdminProduct as Product } from '@/types/product';

type MediaSectionProps = {
    watch: UseFormWatch<ProductFormData>;
    setValue: UseFormSetValue<ProductFormData>;
    product: Product | null;
};

export default function MediaSection({
    watch,
    setValue,
    product,
}: MediaSectionProps) {
    const currentMedia = useMemo(() => {
        if (!product?.media) {
            return [];
        }
        return [...product.media].sort((a, b) => a.display_order - b.display_order);
    }, [product?.media]);

    const toggleRemoveMedia = (id: number) => {
        const current = watch('removed_media_ids') ?? [];
        const exists = current.includes(id);
        const updated = exists ? current.filter((mediaId: number) => mediaId !== id) : [...current, id];
        setValue('removed_media_ids', updated);
    };

    const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
        if (selectedFiles.length === 0) {
            return;
        }

        // Get existing files to avoid duplicates
        const existingFiles = watch('media_uploads') ?? [];
        
        // Filter out duplicates based on file name and size
        const newFiles = selectedFiles.filter((newFile) => {
            return !existingFiles.some(
                (existingFile: File) =>
                    existingFile.name === newFile.name &&
                    existingFile.size === newFile.size
            );
        });

        if (newFiles.length === 0) {
            // All files are duplicates, but still allow selection
            return;
        }

        // Add new files to existing media_uploads array
        const updatedFiles = [...existingFiles, ...newFiles];
        
        setValue('media_uploads', updatedFiles);
        
        // Reset input to allow selecting the same files again if needed
        event.target.value = '';
    };

    const removePendingUpload = (index: number) => {
        setValue(
            'media_uploads',
            (watch('media_uploads') ?? []).filter((_: File, uploadIndex: number) => uploadIndex !== index),
        );
    };

    const isMarkedForRemoval = (id: number) => {
        return (watch('removed_media_ids') ?? []).includes(id);
    };

    const pendingUploads = watch('media_uploads') ?? [];

    const displayMedia = currentMedia.filter((mediaItem: ProductMedia) => !isMarkedForRemoval(mediaItem.id));
    const hasCurrentMedia = displayMedia.length > 0;

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10">
            <div className="flex flex-col gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Product media</h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Upload product images or videos for catalogue displays. You can also remove outdated media assets.
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-6">
                {/* Current media */}
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Current media</h3>
                    {hasCurrentMedia ? (
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {displayMedia.map((mediaItem: ProductMedia) => (
                                <div key={mediaItem.id} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition">
                                    <img
                                        src={getMediaUrl(mediaItem.url)}
                                        alt="Product media"
                                        className="h-48 w-full rounded-t-3xl object-cover"
                                    />
                                    <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
                                        <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-700">IMAGE</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleRemoveMedia(mediaItem.id)}
                                            className="text-rose-500 transition hover:text-rose-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">No media uploaded yet.</p>
                        </div>
                    )}
                </div>

                {/* Upload new files */}
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Upload new files</h3>
                    <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500 transition hover:border-slate-400 hover:bg-slate-100">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleMediaSelect}
                            className="hidden"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-slate-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 014-4h10a4 4 0 014 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Click to upload</p>
                            <p className="mt-1 text-xs text-slate-400">JPEG, PNG, WebP, MP4 up to 50MB each.</p>
                        </div>
                    </label>

                    {/* Pending uploads list */}
                    {pendingUploads.length > 0 && (
                        <ul className="mt-4 space-y-2">
                            {pendingUploads.map((file: File, index: number) => (
                                <li key={`pending-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600">
                                    <span className="truncate">{file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removePendingUpload(index)}
                                        className="text-rose-500 transition hover:text-rose-600"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

