'use client';

import { useEffect, useState } from 'react';
import DeleteUserForm from '@/components/profile/DeleteUserForm';
import UpdatePasswordForm from '@/components/profile/UpdatePasswordForm';
import UpdateProfileInformationForm from '@/components/profile/UpdateProfileInformationForm';

const statusStyles: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-rose-100 text-rose-700',
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock user data
        setUser({
            name: 'Diamond Partner',
            email: 'partner@example.com',
            phone: '+91 98765 43210',
            kyc_status: 'approved',
            type: 'retailer',
            preferred_language: 'en',
            credit_limit: 500000,
            email_verified_at: '2025-01-01T00:00:00.000000Z',
        });
        setLoading(false);
    }, []);

    if (loading || !user) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    const badgeClass = statusStyles[user.kyc_status ?? ''] ?? 'bg-slate-100 text-slate-600';

    return (
        <div className="space-y-10">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_40%),_radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.25),_transparent_45%)]" />
                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-slate-200">Partner profile</p>
                        <h1 className="mt-2 text-3xl font-semibold">{user.name}</h1>
                        <p className="mt-3 max-w-2xl text-sm text-slate-200">
                            Keep your contact details up to date so we can streamline bullion locking, jobwork coordination,
                            and dispatch alerts for your team.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                        <span className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest ${badgeClass}`}>
                            KYC {user.kyc_status ?? 'pending'}
                        </span>
                        <span className="rounded-full bg-white/10 px-4 py-1 text-xs tracking-wide text-white">
                            Account type: {user.type ?? 'partner'}
                        </span>
                    </div>
                </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
                <div className="space-y-8">
                    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/70">
                        <UpdateProfileInformationForm
                            user={user}
                            mustVerifyEmail={false}
                            status=""
                            className=""
                        />
                    </div>
                    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/70">
                        <UpdatePasswordForm className="" />
                    </div>
                </div>

                <aside className="space-y-8">
                    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-rose-200/60">
                        <h2 className="text-lg font-semibold text-slate-900">Danger zone</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Need to deactivate your access? Deleting an account will remove saved carts and jobwork drafts. This
                            action cannot be undone.
                        </p>
                        <div className="mt-6">
                            <DeleteUserForm className="" />
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/70">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Account metrics</h3>
                        <dl className="mt-4 space-y-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <dt className="font-medium text-slate-500">Email</dt>
                                <dd className="text-slate-800">{user.email}</dd>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <dt className="font-medium text-slate-500">Phone</dt>
                                <dd className="text-slate-800">{user.phone ?? '—'}</dd>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <dt className="font-medium text-slate-500">Preferred language</dt>
                                <dd className="text-slate-800">{(user.preferred_language ?? 'en').toUpperCase()}</dd>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <dt className="font-medium text-slate-500">Credit limit</dt>
                                <dd className="text-slate-800">₹ {Number(user.credit_limit ?? 0).toLocaleString('en-IN')}</dd>
                            </div>
                        </dl>
                    </div>
                </aside>
            </section>
        </div>
    );
}

