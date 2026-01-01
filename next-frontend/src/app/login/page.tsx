'use client';

import Checkbox from '@/components/ui/Checkbox';
import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextInput from '@/components/ui/TextInput';
import GuestLayout from '@/components/shared/GuestLayout';
import Link from 'next/link';
import { FormEventHandler, ReactNode, useState } from 'react';
import { route } from '@/utils/route';

type LoginMode = 'password' | 'otp';

import { authService } from '@/services/authService';

export default function Login() {
    const [status, setStatus] = useState<string | undefined>(undefined);
    const canResetPassword = true;

    const [mode, setMode] = useState<LoginMode>('password');
    const [otpRequested, setOtpRequested] = useState(false);
    
    const [passwordData, setPasswordData] = useState({
        email: '',
        password: '',
        remember: false,
    });

    const [otpVerifyData, setOtpVerifyData] = useState({
        email: '',
        code: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const syncEmail = (value: string) => {
        setPasswordData(prev => ({ ...prev, email: value }));
        setOtpVerifyData(prev => ({ ...prev, email: value }));
    };

    const sharedEmail = passwordData.email;

    const submitPassword: FormEventHandler = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await authService.login(passwordData);
            
            // Token is now stored in tokenService, refresh it to ensure it's valid
            const { tokenService } = await import('@/services/tokenService');
            await tokenService.refreshToken();
            
            // Get user data from response to determine redirect
            const user = response.data?.user;
            const userType = (user?.type || '').toLowerCase();
            
            // Determine redirect URL
            let redirectUrl: string;
            if (['admin', 'super-admin'].includes(userType)) {
                redirectUrl = route('admin.dashboard');
            } else if (userType === 'production') {
                redirectUrl = route('production.dashboard');
            } else {
                redirectUrl = route('dashboard');
            }
            
            // Use window.location.href for full page reload to ensure auth state is properly refreshed
            // This ensures middleware and auth checks run with the new token
            window.location.href = redirectUrl;
        } catch (error: any) {
            if (error.response?.status === 401) {
                setErrors({ email: 'Invalid credentials.' });
            } else if (error.response?.data?.message) {
                setErrors({ email: error.response.data.message });
            } else {
                setErrors({ email: 'An error occurred. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const submitOtpRequest: FormEventHandler = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});
        
        try {
            await authService.requestOtp(sharedEmail);
            setOtpRequested(true);
            setStatus('A one-time code has been emailed.');
        } catch (error: any) {
            setErrors({ email: error.response?.data?.message || 'Failed to send code.' });
        } finally {
            setProcessing(false);
        }
    };

    const submitOtpVerify: FormEventHandler = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});
        
        try {
            const response = await authService.verifyOtp({ email: sharedEmail, code: otpVerifyData.code });
            
            // Token is now stored in tokenService, refresh it to ensure it's valid
            const { tokenService } = await import('@/services/tokenService');
            await tokenService.refreshToken();
            
            // Get user data from response to determine redirect
            const user = response.data?.user;
            const userType = (user?.type || '').toLowerCase();
            
            // Determine redirect URL
            let redirectUrl: string;
            if (['admin', 'super-admin'].includes(userType)) {
                redirectUrl = route('admin.dashboard');
            } else if (userType === 'production') {
                redirectUrl = route('production.dashboard');
            } else {
                redirectUrl = route('dashboard');
            }
            
            // Use window.location.href for full page reload to ensure auth state is properly refreshed
            // This ensures middleware and auth checks run with the new token
            window.location.href = redirectUrl;
        } catch (error: any) {
            setErrors({ code: error.response?.data?.message || 'Invalid code.' });
        } finally {
            setProcessing(false);
        }
    };

    const ArrowRightIcon = () => (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m9.5 4.5 3.5 3.5-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const experienceHighlights: Array<{ title: string; description: string; icon: ReactNode }> = [
        {
            title: 'Wholesale cockpit',
            description: 'Track catalogue enquiries, allocations, and approvals in real time.',
            icon: (
                <svg
                    className="h-5 w-5 text-feather-gold"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M4 7h16" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M5 20h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1Z" />
                </svg>
            ),
        },
        {
            title: 'Jobwork monitor',
            description: 'Submit production briefs and receive milestone alerts instantly.',
            icon: (
                <svg
                    className="h-5 w-5 text-feather-gold"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2v4" />
                    <path d="m16.2 7.8 2.8-2.8" />
                    <path d="M20 12h4" />
                    <path d="m16.2 16.2 2.8 2.8" />
                    <path d="M12 18v4" />
                    <path d="m5 5 2.8 2.8" />
                    <path d="M2 12h4" />
                    <path d="m5 19 2.8-2.8" />
                    <circle cx="12" cy="12" r="3.5" />
                </svg>
            ),
        },
        {
            title: 'Rates & offers',
            description: 'Access locked bullion rates, metal credits, and retailer-specific offers.',
            icon: (
                <svg
                    className="h-5 w-5 text-feather-gold"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 1v22" />
                    <path d="M17 5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />
                </svg>
            ),
        },
    ];

    return (
        <GuestLayout>
            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 px-1 sm:gap-8 sm:px-6 lg:grid-cols-[420px,minmax(0,1fr)] lg:gap-10 lg:px-10">
                <aside className="space-y-4 rounded-3xl bg-white/85 p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur sm:space-y-6 sm:p-6 lg:p-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-feather-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-feather-gold sm:px-4 sm:text-xs">
                        Wholesale & retail access
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                        <h1 className="text-xl font-semibold text-elvee-blue sm:text-2xl lg:text-3xl">Welcome back to Elvee</h1>
                        <p className="text-xs text-ink/80 sm:text-sm">
                            Collaborate on pricing approvals, bullion locks, and production milestones with one elegant command center.
                        </p>
                    </div>
                    <ul className="space-y-3 sm:space-y-4">
                        {experienceHighlights.map((item) => (
                            <li key={item.title} className="flex gap-3 rounded-2xl border border-elvee-blue/10 bg-ivory/70 p-3 sm:gap-4 sm:p-4">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-feather-gold/40 bg-feather-gold/15 sm:h-10 sm:w-10">
                                    {item.icon}
                                </div>
                                <div className="space-y-1 text-xs text-ink/80 sm:text-sm">
                                    <p className="font-semibold text-ink">{item.title}</p>
                                    <p>{item.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {status && (
                        <div className="rounded-2xl border border-feather-gold/30 bg-feather-gold/10 px-3 py-2 text-xs font-medium text-ink sm:px-4 sm:py-3 sm:text-sm">
                            {status}
                        </div>
                    )}

                    <p className="text-xs text-ink/70 sm:text-sm">
                        New to Elvee?{' '}
                        <Link href={route('auth.register')} className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold">
                            Create an account
                        </Link>
                    </p>
                </aside>

                <div className="space-y-4">
                    <div className="rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 sm:p-6 lg:p-8">
                        <header className="mb-4 space-y-2 sm:mb-6">
                            <div className="inline-flex items-center gap-2 rounded-full bg-ivory px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-elvee-blue sm:px-3 sm:text-[11px]">
                                Secure login
                            </div>
                            <h2 className="text-xl font-semibold text-elvee-blue sm:text-2xl">Access your Elvee workspace</h2>
                            <p className="text-xs text-ink/70 sm:text-sm">Choose your preferred authentication path - strong password or verified one-time passcode.</p>
                        </header>

                        <div className="mb-4 flex items-center justify-center rounded-full bg-ivory p-1 text-xs font-medium text-ink/60 sm:mb-6 sm:text-sm">
                            <button
                                type="button"
                                onClick={() => setMode('password')}
                                className={`flex-1 rounded-full px-3 py-1.5 transition sm:px-4 sm:py-2 ${
                                    mode === 'password' ? 'bg-elvee-blue text-white shadow-sm shadow-elvee-blue/40' : 'text-ink/70'
                                }`}
                            >
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('otp')}
                                className={`flex-1 rounded-full px-3 py-1.5 transition sm:px-4 sm:py-2 ${
                                    mode === 'otp' ? 'bg-elvee-blue text-white shadow-sm shadow-elvee-blue/40' : 'text-ink/70'
                                }`}
                            >
                                Email OTP
                            </button>
                        </div>

                        {mode === 'password' ? (
                            <form onSubmit={submitPassword} className="space-y-4 sm:space-y-5">
                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={sharedEmail}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(event) => syncEmail(event.target.value)}
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value="Password" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={passwordData.password}
                                        className="mt-1 block w-full"
                                        autoComplete="current-password"
                                        onChange={(event) => setPasswordData(prev => ({ ...prev, password: event.target.value }))}
                                    />
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                                    <label className="flex items-center gap-2 text-ink/70">
                                        <Checkbox
                                            name="remember"
                                            checked={passwordData.remember}
                                            onChange={(event) => setPasswordData(prev => ({ ...prev, remember: event.target.checked }))}
                                        />
                                        <span>Remember me</span>
                                    </label>
                                    <Link
                                        href={route('password.request')}
                                        className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <PrimaryButton className="w-full gap-1.5 py-2 text-xs sm:gap-2 sm:py-2.5 sm:text-sm" disabled={processing}>
                                    <span>Log in</span>
                                    <ArrowRightIcon />
                                </PrimaryButton>
                            </form>
                        ) : (
                            <div className="space-y-4 sm:space-y-6">
                                <form onSubmit={submitOtpRequest} className="space-y-3 sm:space-y-4">
                                    <div>
                                        <InputLabel htmlFor="otp_email" value="Email" />
                                        <TextInput
                                            id="otp_email"
                                            type="email"
                                            name="email"
                                            value={sharedEmail}
                                            className="mt-1 block w-full"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(event) => syncEmail(event.target.value)}
                                        />
                                        <InputError message={errors.email} className="mt-2" />
                                    </div>
                                    <PrimaryButton className="w-full gap-1.5 py-2 text-xs sm:gap-2 sm:py-2.5 sm:text-sm" disabled={processing}>
                                        <span>{otpRequested ? 'Resend code' : 'Send login code'}</span>
                                        <ArrowRightIcon />
                                    </PrimaryButton>
                                </form>

                                <form onSubmit={submitOtpVerify} className="space-y-3 sm:space-y-4">
                                    <div>
                                        <InputLabel htmlFor="otp_code" value="One-time code" />
                                        <TextInput
                                            id="otp_code"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            name="code"
                                            value={otpVerifyData.code}
                                            className="mt-1 block w-full tracking-[0.5em]"
                                            placeholder="------"
                                            onChange={(event) => setOtpVerifyData(prev => ({ ...prev, code: event.target.value }))}
                                        />
                                        <InputError message={errors.code} className="mt-2" />
                                    </div>
                                    <PrimaryButton className="w-full gap-1.5 py-2 text-xs sm:gap-2 sm:py-2.5 sm:text-sm" disabled={processing || !otpRequested}>
                                        <span>Log in with code</span>
                                        <ArrowRightIcon />
                                    </PrimaryButton>
                                </form>
                            </div>
                        )}

                        <div className="mt-4 text-center text-xs text-ink/70 sm:mt-6 sm:text-sm">
                            {mode === 'password' ? (
                                <button
                                    type="button"
                                    onClick={() => setMode('otp')}
                                    className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
                                >
                                    Prefer email OTP? Get a code instead
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setMode('password')}
                                    className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold"
                                >
                                    Back to password login
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-feather-gold/50 bg-feather-gold/5 px-4 py-3 text-center text-xs text-ink/80 sm:px-6 sm:py-4 sm:text-sm">
                        Need access for your retail or wholesale team?{' '}
                        <Link href={route('auth.register')} className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold">
                            Request onboarding
                        </Link>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
