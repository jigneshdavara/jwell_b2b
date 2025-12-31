'use client';

import { useEffect, useState } from 'react';
import DeleteUserForm from '@/components/profile/DeleteUserForm';
import UpdatePasswordForm from '@/components/profile/UpdatePasswordForm';
import UpdateProfileInformationForm from '@/components/profile/UpdateProfileInformationForm';
import { frontendService } from '@/services/frontendService';
import { Head } from '@/components/Head';

const statusStyles: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-rose-100 text-rose-700',
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mustVerifyEmail, setMustVerifyEmail] = useState(false);
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await frontendService.getProfile();
                const profileData = response.data?.profile || response.data;
                
                // Map backend response to frontend format (matching Laravel structure)
                const mappedUser = {
                    id: typeof profileData.id === 'string' ? Number(profileData.id) : Number(profileData.id || 0),
                    name: profileData.name || '',
                    email: profileData.email || '',
                    phone: profileData.phone || null,
                    kyc_status: profileData.kyc_status || 'pending',
                    type: profileData.type || 'retailer',
                    preferred_language: profileData.preferred_language || 'en',
                    credit_limit: profileData.credit_limit !== null && profileData.credit_limit !== undefined 
                        ? Number(profileData.credit_limit) 
                        : 0,
                    email_verified_at: profileData.email_verified_at || null,
                };
                
                setUser(mappedUser);
                setMustVerifyEmail(!profileData.email_verified_at);
            } catch (error: any) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfile();
    }, []);

    if (loading || !user) {
        return (
            <div className="flex justify-center py-12 sm:py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent sm:h-12 sm:w-12" />
            </div>
        );
    }

    const badgeClass = statusStyles[user.kyc_status ?? ''] ?? 'bg-slate-100 text-slate-600';

    return (
        <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            <Head title="Profile" />
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4 text-white shadow-2xl sm:rounded-3xl sm:p-6 lg:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_40%),_radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.25),_transparent_45%)]" />
                <div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-200 sm:text-xs lg:text-sm">Partner profile</p>
                        <h1 className="mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl lg:text-3xl">{user.name}</h1>
                        <p className="mt-2 max-w-2xl text-xs text-slate-200 sm:mt-3 sm:text-sm">
                            Keep your contact details up to date so we can streamline bullion locking, jobwork coordination,
                            and dispatch alerts for your team.
                        </p>
                    </div>
                    <div className="flex flex-col items-start gap-1.5 sm:gap-2 md:items-end">
                        <span className={`rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest sm:px-4 sm:py-1 sm:text-xs ${badgeClass}`}>
                            KYC {user.kyc_status ?? 'pending'}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-0.5 text-[10px] tracking-wide text-white sm:px-4 sm:py-1 sm:text-xs">
                            Account type: {user.type ?? 'partner'}
                        </span>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 sm:gap-8 lg:grid-cols-[1.6fr_1fr]">
                <div className="space-y-6 sm:space-y-8">
                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6 lg:p-8">
                        <UpdateProfileInformationForm
                            user={user}
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className=""
                        />
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6 lg:p-8">
                        <UpdatePasswordForm className="" />
                    </div>
                </div>

                <aside className="space-y-6 sm:space-y-8">
                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-rose-200/60 sm:rounded-3xl sm:p-6 lg:p-8">
                        <h2 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">Danger zone</h2>
                        <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                            Need to deactivate your access? Deleting an account will remove saved carts and jobwork drafts. This
                            action cannot be undone.
                        </p>
                        <div className="mt-4 sm:mt-6">
                            <DeleteUserForm className="" />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6 lg:p-8">
                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs lg:text-sm">Account metrics</h3>
                        <dl className="mt-3 space-y-2 text-xs text-slate-700 sm:mt-4 sm:space-y-3 sm:text-sm">
                            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-4 sm:py-3 sm:gap-2">
                                <dt className="font-medium text-slate-500 text-[10px] sm:text-xs">Email</dt>
                                <dd className="text-slate-800 break-all text-right text-[10px] sm:text-xs sm:text-left">{user.email}</dd>
                            </div>
                            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-4 sm:py-3 sm:gap-2">
                                <dt className="font-medium text-slate-500 text-[10px] sm:text-xs">Phone</dt>
                                <dd className="text-slate-800 text-right text-[10px] sm:text-xs sm:text-left">{user.phone ?? '—'}</dd>
                            </div>
                            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-4 sm:py-3 sm:gap-2">
                                <dt className="font-medium text-slate-500 text-[10px] sm:text-xs">Preferred language</dt>
                                <dd className="text-slate-800 text-right text-[10px] sm:text-xs sm:text-left">{(user.preferred_language ?? 'en').toUpperCase()}</dd>
                            </div>
                            <div className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-4 sm:py-3 sm:gap-2">
                                <dt className="font-medium text-slate-500 text-[10px] sm:text-xs">Credit limit</dt>
                                <dd className="text-slate-800 text-right text-[10px] sm:text-xs sm:text-left">₹ {Number(user.credit_limit ?? 0).toLocaleString('en-IN')}</dd>
                            </div>
                        </dl>
                    </div>
                </aside>
            </section>
        </div>
    );
}

