'use client';

import Checkbox from '@/components/ui/Checkbox';
import InputError from '@/components/ui/InputError';
import InputLabel from '@/components/ui/InputLabel';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextInput from '@/components/ui/TextInput';
import GuestLayout from '@/components/shared/GuestLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEventHandler, ReactNode, useState } from 'react';
import { route } from '@/utils/route';

type LoginMode = 'password' | 'otp';

import { authService } from '@/services/authService';

export default function Login() {
    const router = useRouter();
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
            // Check user type and redirect accordingly
            const user = response.data?.user || JSON.parse(localStorage.getItem('user') || '{}');
            const userType = (user.type || '').toLowerCase();
            
            if (['admin', 'super-admin'].includes(userType)) {
                router.push(route('admin.dashboard'));
            } else if (userType === 'production') {
                router.push(route('production.dashboard'));
            } else {
                router.push(route('dashboard'));
            }
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
            // Check user type and redirect accordingly
            const user = response.data?.user || JSON.parse(localStorage.getItem('user') || '{}');
            const userType = (user.type || '').toLowerCase();
            
            if (['admin', 'super-admin'].includes(userType)) {
                router.push(route('admin.dashboard'));
            } else if (userType === 'production') {
                router.push(route('production.dashboard'));
            } else {
                router.push(route('dashboard'));
            }
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
            <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[420px,minmax(0,1fr)]">
                <aside className="space-y-6 rounded-3xl bg-white/85 p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10 backdrop-blur">
                    <div className="inline-flex items-center gap-2 rounded-full bg-feather-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-feather-gold">
                        Wholesale & retail access
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-semibold text-elvee-blue">Welcome back to Elvee</h1>
                        <p className="text-sm text-ink/80">
                            Collaborate on pricing approvals, bullion locks, and production milestones with one elegant command center.
                        </p>
                    </div>
                    <ul className="space-y-4">
                        {experienceHighlights.map((item) => (
                            <li key={item.title} className="flex gap-4 rounded-2xl border border-elvee-blue/10 bg-ivory/70 p-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-feather-gold/40 bg-feather-gold/15">
                                    {item.icon}
                                </div>
                                <div className="space-y-1 text-sm text-ink/80">
                                    <p className="font-semibold text-ink">{item.title}</p>
                                    <p>{item.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {status && (
                        <div className="rounded-2xl border border-feather-gold/30 bg-feather-gold/10 px-4 py-3 text-sm font-medium text-ink">
                            {status}
                        </div>
                    )}

                    <p className="text-sm text-ink/70">
                        New to Elvee?{' '}
                        <Link href={route('auth.register')} className="font-semibold text-elvee-blue underline decoration-feather-gold decoration-2 underline-offset-4 hover:text-feather-gold">
                            Create an account
                        </Link>
                    </p>
                </aside>

                <div className="space-y-4">
                    <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10">
                        <header className="mb-6 space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-ivory px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-elvee-blue">
                                Secure login
                            </div>
                            <h2 className="text-2xl font-semibold text-elvee-blue">Access your Elvee workspace</h2>
                            <p className="text-sm text-ink/70">Choose your preferred authentication path - strong password or verified one-time passcode.</p>
                        </header>

                        <div className="mb-6 flex items-center justify-center rounded-full bg-ivory p-1 text-sm font-medium text-ink/60">
                            <button
                                type="button"
                                onClick={() => setMode('password')}
                                className={`flex-1 rounded-full px-4 py-2 transition ${
                                    mode === 'password' ? 'bg-elvee-blue text-white shadow-sm shadow-elvee-blue/40' : 'text-ink/70'
                                }`}
                            >
                                Password
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('otp')}
                                className={`flex-1 rounded-full px-4 py-2 transition ${
                                    mode === 'otp' ? 'bg-elvee-blue text-white shadow-sm shadow-elvee-blue/40' : 'text-ink/70'
                                }`}
                            >
                                Email OTP
                            </button>
                        </div>

                        {mode === 'password' ? (
                            <form onSubmit={submitPassword} className="space-y-5">
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

                                <div className="flex items-center justify-between text-sm">
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

                                <PrimaryButton className="w-full gap-2" disabled={processing}>
                                    <span>Log in</span>
                                    <ArrowRightIcon />
                                </PrimaryButton>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <form onSubmit={submitOtpRequest} className="space-y-4">
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
                                    <PrimaryButton className="w-full gap-2" disabled={processing}>
                                        <span>{otpRequested ? 'Resend code' : 'Send login code'}</span>
                                        <ArrowRightIcon />
                                    </PrimaryButton>
                                </form>

                                <form onSubmit={submitOtpVerify} className="space-y-4">
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
                                    <PrimaryButton className="w-full gap-2" disabled={processing || !otpRequested}>
                                        <span>Log in with code</span>
                                        <ArrowRightIcon />
                                    </PrimaryButton>
                                </form>
                            </div>
                        )}

                        <div className="mt-6 text-center text-sm text-ink/70">
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

                    <div className="rounded-2xl border border-dashed border-feather-gold/50 bg-feather-gold/5 px-6 py-4 text-center text-sm text-ink/80">
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
